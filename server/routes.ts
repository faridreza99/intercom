import type { Express } from "express"; import { createServer, type Server } from "http"; import { storage } from "./storage"; import { logger } from "./services/logger"; import { createTrustpilotService } from "./services/trustpilot"; import { createIntercomService } from "./services/intercom"; import { createEmailService, type ReviewInvitationData } from "./services/email"; import { intercomWebhookSchema } from "@shared/schema"; import { z } from "zod"; import { log } from "./vite"; import bodyParser from "body-parser";

// Retry configuration const RETRY_DELAYS = [5000, 10000, 20000]; // 5s, 10s, 20s const MAX_RETRIES = 3;

async function delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

async function processInvitationWithRetry( conversationId: string, email: string, name: string, agentName: string, retryCount = 0 ): Promise<void> { try { const emailService = createEmailService();

// Generate Trustpilot review link
const businessName = process.env.BUSINESS_NAME || 'Our Business';
const trustpilotDomain = process.env.TRUSTPILOT_DOMAIN || 'your-business.trustpilot.com';
const reviewLink = https://www.trustpilot.com/evaluate/${trustpilotDomain}?utm_source=email&utm_medium=invitation&utm_campaign=intercom_automation;

const reviewData: ReviewInvitationData = {
  customerEmail: email,
  customerName: name,
  agentName,
  conversationId,
  businessName,
  reviewLink,
};

const result = await emailService.sendReviewInvitation(reviewData);

if (result.success) {
  await storage.updateInvitationLog(conversationId, {
    status: 'success',
    responseLog: JSON.stringify(result),
  });
  await storage.incrementInviteCount('success');

  const updatedLog = await storage.getInvitationLog(conversationId);
  if (updatedLog) {
    await logger.logInvitation(updatedLog);
  }

  console.log(Successfully sent invitation for conversation ${conversationId});
} else {
  throw new Error(result.error || 'Failed to send invitation');
}

} catch (error: any) { console.error(Error sending invitation for conversation ${conversationId}:, error);

if (retryCount < MAX_RETRIES) {
  await storage.updateInvitationLog(conversationId, {
    status: 'retrying',
    retryCount: retryCount + 1,
    errorMessage: error.message,
  });

  const delayMs = RETRY_DELAYS[retryCount];
  console.log(Retrying in ${delayMs}ms...);

  setTimeout(() => {
    processInvitationWithRetry(conversationId, email, name, agentName, retryCount + 1);
  }, delayMs);
} else {
  await storage.updateInvitationLog(conversationId, {
    status: 'failed',
    errorMessage: error.message,
  });

  await storage.incrementInviteCount('failed');

  const log = await storage.getInvitationLog(conversationId);
  if (log) {
    await logger.logInvitation(log);
  }

  console.error(Failed to send invitation for conversation ${conversationId} after ${MAX_RETRIES} attempts);
}

} }

export async function registerRoutes(app: Express): Promise<Server> { app.use('/api/webhook/intercom', bodyParser.raw({ type: () => true })); app.use('/api/notifications/intercom', bodyParser.raw({ type: () => true }));

app.options("/api/webhook/intercom", (req, res) => { res.header('Access-Control-Allow-Origin', req.get('Origin') || '*'); res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'); res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Intercom-Webhook-Secret,X-Requested-With,Origin,Accept'); res.header('Access-Control-Max-Age', '86400'); res.status(204).end(); });

app.use('/api', (req, res, next) => { res.header('Access-Control-Allow-Origin', req.get('Origin') || '*'); res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'); res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Intercom-Webhook-Secret,X-Requested-With,Origin,Accept'); if (req.method === 'OPTIONS') { return res.status(204).end(); } next(); });

app.get("/api/webhook/intercom", async (req, res) => { const challenge = req.query['hub.challenge']; if (challenge) { log('Intercom webhook verification challenge received: ' + challenge); res.status(200).send(challenge); return; } res.status(200).send('Webhook endpoint is active'); });

app.post("/api/webhook/intercom", async (req, res) => { try { const rawBody = req.body; const jsonString = rawBody.toString("utf8"); const parsed = JSON.parse(jsonString); const validatedData = intercomWebhookSchema.parse(parsed); const conversation = validatedData.data.item; const conversationId = conversation.id;

const contacts = conversation.contacts?.contacts || [];
  if (contacts.length === 0) {
    log(No contacts found in conversation ${conversationId});
    return res.status(200).json({ message: 'No contacts to process' });
  }

  const customer = contacts[0];
  const email = customer.email;
  const name = customer.name || 'Valued Customer';

  if (!email) {
    log(No email found for conversation ${conversationId});
    return res.status(200).json({ message: 'No customer email found' });
  }

  const parts = conversation.conversation_parts?.conversation_parts || [];
  const lastPart = parts[parts.length - 1];
  const agentName = lastPart?.author?.name || 'Our Support Team';

  if (validatedData.type === 'conversation.admin.closed') {
    await storage.createInvitationLog({
      conversationId,
      customerEmail: email,
      customerName: name,
      agentName,
      status: 'processing',
    });

    processInvitationWithRetry(conversationId, email, name, agentName).catch(error => {
      console.error(Async invitation processing failed for ${conversationId}:, error);
    });

    log(Started processing invitation for ${email} (conversation: ${conversationId}));

    return res.status(200).json({
      message: 'Webhook processed successfully',
      conversationId,
      customerEmail: email,
      timestamp: new Date().toISOString()
    });
  } else {
    log(Ignored webhook type: ${validatedData.type});
    return res.status(200).json({
      message: 'Webhook received but not processed',
      type: validatedData.type,
      timestamp: new Date().toISOString()
    });
  }
} catch (error: any) {
  console.error('Error processing webhook:', error);
  log(Webhook processing error: ${error.message});
  return res.status(200).json({ 
    message: 'Webhook received but processing failed', 
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

});

const server = createServer(app); return server; }
