import type { Express } from "express";
import { createServer, type Server } from "http";
import { log } from "./vite";
import bodyParser from "body-parser";

// Retry config placeholder (can be extended later)
const RETRY_DELAYS = [5000, 10000, 20000];
const MAX_RETRIES = 3;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware: Accept raw body for webhook
  app.use('/api/webhook/intercom', bodyParser.raw({ type: () => true }));

  // Handle preflight (OPTIONS) for CORS
  app.options("/api/webhook/intercom", (req, res) => {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Intercom-Webhook-Secret,X-Requested-With,Origin,Accept');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).end();
  });

  // ✅ STEP 1: Webhook POST endpoint (Basic Data Extraction)
  app.post("/api/webhook/intercom", async (req, res) => {
    log(🔔 WEBHOOK POST ${req.originalUrl});

    try {
      const bodyString = req.body.toString('utf8');
      const webhookJson = JSON.parse(bodyString);
      const data = webhookJson?.data?.item;

      const email = data?.contacts?.contacts?.[0]?.email || 'No email';
      const name = data?.contacts?.contacts?.[0]?.name || 'No name';
      const agent = data?.assignee?.name || 'Unknown agent';
      const conversationId = data?.id || 'No ID';

      console.log("✅ Webhook Data:", { email, name, agent, conversationId });

      return res.status(200).json({
        message: 'Webhook received successfully',
        status: 'ok',
        timestamp: new Date().toISOString(),
        email,
        name,
        agent,
        conversationId
      });
    } catch (err: any) {
      console.error('❌ Webhook parse error:', err);
      return res.status(200).json({
        message: 'Webhook received but JSON parse failed',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 👇 Later you can add other routes (like /api/logs, /api/health) here

  const server = createServer(app);
  return server;
}
