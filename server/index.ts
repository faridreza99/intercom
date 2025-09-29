import dotenv from "dotenv";
dotenv.config(); // 🔥 Load environment variables from .env

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// -------------------- Environment validation --------------------
function validateEnvironment() {
  const requiredEnvVars = ["SMTP_USER", "SMTP_PASSWORD"];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Required environment variable ${envVar} is missing`);
    }
  }

  const optionalEnvVars = [
    { name: "INTERCOM_TOKEN", description: "Required for Intercom integration" },
    { name: "BUSINESS_NAME", description: "Used in email templates" },
    { name: "TRUSTPILOT_DOMAIN", description: "Required for review link generation" },
  ];

  for (const { name, description } of optionalEnvVars) {
    if (!process.env[name]) {
      warnings.push(`Optional environment variable ${name} is missing: ${description}`);
    }
  }

  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    errors.push("PORT environment variable must be a valid number");
  }

  return { errors, warnings };
}

// -------------------- App setup --------------------
const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Intercom-Webhook-Secret", "X-Requested-With"],
    credentials: false,
  })
);

app.set("case sensitive routing", false);
app.set("strict routing", false);

// Skip JSON parsing for webhook routes
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api/webhook/intercom") ||
    req.path.startsWith("/api/notifications/intercom")
  ) {
    return next();
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: false }));

// -------------------- Request logging --------------------
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
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// -------------------- Bootstrap server --------------------
(async () => {
  const { errors, warnings } = validateEnvironment();

  if (warnings.length > 0) {
    log("Environment warnings detected:", "config");
    warnings.forEach((warning) => log(`  ⚠️  ${warning}`, "config"));
  }

  if (errors.length > 0) {
    log("Environment configuration issues detected:", "config");
    errors.forEach((error) => log(`  ❌ ${error}`, "config"));
    log("Application will start with degraded functionality", "config");
  }

  const server = await registerRoutes(app);

  // -------------------- Error handler --------------------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Unhandled error: ${message}`, "error");
  });

  // -------------------- Frontend setup --------------------
  try {
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Development server setup completed", "vite");
    } else {
      serveStatic(app);
      log("Static file serving configured", "static");
    }
  } catch (error: any) {
    log(`Frontend setup failed: ${error.message}`, "error");
    log("Application will continue without frontend assets", "error");
  }

  // -------------------- Start server --------------------
  const port = parseInt(process.env.PORT || "5000", 10);

  try {
    server.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`Serving on port ${port}`, "startup");
        log("Application successfully initialized", "startup");
      }
    );

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        log(`Port ${port} is already in use. Exiting...`, "error");
        process.exit(1);
      } else {
        log(`Server error: ${err.message}`, "error");
      }
    });
  } catch (error: any) {
    log(`Failed to start server: ${error.message}`, "error");
    process.exit(1);
  }
})();
