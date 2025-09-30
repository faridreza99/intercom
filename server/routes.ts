import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { logger } from "./services/logger";
import { createTrustpilotService } from "./services/trustpilot";
import { createIntercomService } from "./services/intercom";
import { createEmailService, type ReviewInvitationData } from "./services/email";
import { intercomWebhookSchema } from "@shared/schema";
import { z } from "zod";
import { log } from "./vite";
import bodyParser from "body-parser";

// Retry configuration
const RETRY_DELAYS = [5000, 10000, 20000];
const MAX_RETRIES = 3;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use('/api/webhook/intercom', bodyParser.raw({ type: () => true }));

  app.options("/api/webhook/intercom", (req, res) => {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Intercom-Webhook-Secret,X-Requested-With,Origin,Accept');
    res.header('Access-Control-Max-Age', '86400');
    res.status(204).end();
  });

  app.post("/api/webhook/intercom", async (req, res) => {
    log(🔔 WEBHOOK POST ${req.originalUrl});

    // ✅ STEP 1: Webhook Data Extraction
    try {
      const data = req.body?.data?.item;

      const email = data?.contacts?.[0]?.email;
      const name = data?.contacts?.[0]?.name;
      const agent = data?.assignee?.name;
      const conversationId = data?.id;

      console.log("Webhook Data:", { email, name, agent, conversationId });

      return res.status(200).json({
        message: 'Webhook endpoint is ready and active',
        status: 'ok',
        timestamp: new Date().toISOString(),
        email,
        name,
        agent,
        conversationId
      });
    } catch (err: any) {
      console.error('Webhook parse error:', err);
      return res.status(200).json({
        message: 'Webhook endpoint active but parsing failed',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 👇 other routes remain unchanged
  // You can add others like /api/health, /api/logs etc. after this step
  const server = createServer(app);
  return server;
}
