import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invitationLogs = pgTable("invitation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: text("conversation_id").notNull().unique(),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  agentName: text("agent_name").notNull(),
  status: text("status").notNull(), // 'success', 'failed', 'retrying'
  retryCount: integer("retry_count").default(0),
  errorMessage: text("error_message"),
  trustpilotInvitationId: text("trustpilot_invitation_id"),
  responseLog: jsonb("response_log"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const systemStats = pgTable("system_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalInvites: integer("total_invites").default(0),
  successfulInvites: integer("successful_invites").default(0),
  failedInvites: integer("failed_invites").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertInvitationLogSchema = createInsertSchema(invitationLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({
  id: true,
  lastUpdated: true,
});

export type InsertInvitationLog = z.infer<typeof insertInvitationLogSchema>;
export type InvitationLog = typeof invitationLogs.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;
export type SystemStats = typeof systemStats.$inferSelect;

// Webhook payload schema
export const intercomWebhookSchema = z.object({
  type: z.enum(["conversation.closed", "conversation.admin.closed", "conversation.admin.replied", "conversation.user.created"]),
  data: z.object({
    item: z.object({
      id: z.string(),
      contacts: z.object({
        contacts: z.array(z.object({
          email: z.string().email(),
          name: z.string().optional(),
        })),
      }),
      conversation_parts: z.object({
        conversation_parts: z.array(z.object({
          author: z.object({
            name: z.string().optional(),
            type: z.string(),
          }),
        })),
      }),
    }),
  }),
});

export type IntercomWebhookPayload = z.infer<typeof intercomWebhookSchema>;
