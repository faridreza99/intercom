import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Environment validation and configuration
function validateEnvironment() {
  const requiredEnvVars = ['SMTP_USER', 'SMTP_PASSWORD'];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required environment variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Required environment variable ${envVar} is missing`);
    }
  }

  // Check optional but recommended environment variables
  const optionalEnvVars = [
    { name: 'INTERCOM_TOKEN', description: 'Required for Intercom integration' },
    { name: 'BUSINESS_NAME', description: 'Used in email templates' },
    { name: 'TRUSTPILOT_DOMAIN', description: 'Required for review link generation' }
  ];

  for (const { name, description } of optionalEnvVars) {
    if (!process.env[name]) {
      warnings.push(`Optional environment variable ${name} is missing: ${description}`);
    }
  }

  // Validate PORT if provided
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    errors.push('PORT environment variable must be a valid number');
  }

  return { errors, warnings };
}

const app = express();

// Enable CORS for all routes - required for external webhook requests
app.use(cors({
  origin: true, // Allow all origins for webhook testing (Intercom sends from various domains)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Intercom-Webhook-Secret', 'X-Requested-With'],
  credentials: false
}));

// Configure Express routing settings
app.set('case sensitive routing', false);
app.set('strict routing', false);

// Apply JSON parsing to all routes EXCEPT webhook routes (which use raw body parser)
app.use((req, res, next) => {
  // Use startsWith to handle trailing slashes and query params  
  if (req.path.startsWith('/api/webhook/intercom') || req.path.startsWith('/api/notifications/intercom')) {
    return next(); // Skip JSON parsing for webhook routes
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: false }));

// Production webhook system ready - debug logging removed


app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate environment configuration before starting services
  const { errors, warnings } = validateEnvironment();
  
  // Log warnings but continue
  if (warnings.length > 0) {
    log('Environment warnings detected:', 'config');
    warnings.forEach(warning => log(`  ⚠️  ${warning}`, 'config'));
  }
  
  // Log errors and continue with degraded functionality
  if (errors.length > 0) {
    log('Environment configuration issues detected:', 'config');
    errors.forEach(error => log(`  ❌ ${error}`, 'config'));
    log('Application will start with degraded functionality', 'config');
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  try {
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Development server setup completed', 'vite');
    } else {
      serveStatic(app);
      log('Static file serving configured', 'static');
    }
  } catch (error: any) {
    log(`Frontend setup failed: ${error.message}`, 'error');
    log('Application will continue without frontend assets', 'error');
    // Continue startup even if frontend setup fails
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  try {
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`, 'startup');
      log('Application successfully initialized', 'startup');
    });

    // Handle server errors gracefully
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Attempting to use a different port...`, 'error');
        // In production, this would be a critical error
        process.exit(1);
      } else {
        log(`Server error: ${err.message}`, 'error');
        // Log error but don't exit to allow graceful degradation
      }
    });

  } catch (error: any) {
    log(`Failed to start server: ${error.message}`, 'error');
    log('Application initialization failed', 'error');
    process.exit(1);
  }
})();
