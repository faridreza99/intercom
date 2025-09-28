import { type InvitationLog, type InsertInvitationLog, type SystemStats, type InsertSystemStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Invitation logs
  getInvitationLog(conversationId: string): Promise<InvitationLog | undefined>;
  createInvitationLog(log: InsertInvitationLog): Promise<InvitationLog>;
  updateInvitationLog(conversationId: string, updates: Partial<InvitationLog>): Promise<InvitationLog | undefined>;
  getAllInvitationLogs(limit?: number, offset?: number): Promise<InvitationLog[]>;
  
  // System stats
  getSystemStats(): Promise<SystemStats | undefined>;
  updateSystemStats(stats: Partial<InsertSystemStats>): Promise<SystemStats>;
  incrementInviteCount(status: 'success' | 'failed'): Promise<void>;
}

export class MemStorage implements IStorage {
  private invitationLogs: Map<string, InvitationLog>;
  private systemStats: SystemStats;

  constructor() {
    this.invitationLogs = new Map();
    this.systemStats = {
      id: randomUUID(),
      totalInvites: 0,
      successfulInvites: 0,
      failedInvites: 0,
      lastUpdated: new Date(),
    };
  }

  async getInvitationLog(conversationId: string): Promise<InvitationLog | undefined> {
    return this.invitationLogs.get(conversationId);
  }

  async createInvitationLog(insertLog: InsertInvitationLog): Promise<InvitationLog> {
    const log: InvitationLog = {
      id: randomUUID(),
      ...insertLog,
      retryCount: insertLog.retryCount ?? 0,
      errorMessage: insertLog.errorMessage ?? null,
      trustpilotInvitationId: insertLog.trustpilotInvitationId ?? null,
      responseLog: insertLog.responseLog ?? null,
      timestamp: new Date(),
    };
    this.invitationLogs.set(log.conversationId, log);
    return log;
  }

  async updateInvitationLog(conversationId: string, updates: Partial<InvitationLog>): Promise<InvitationLog | undefined> {
    const existing = this.invitationLogs.get(conversationId);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.invitationLogs.set(conversationId, updated);
    return updated;
  }

  async getAllInvitationLogs(limit = 50, offset = 0): Promise<InvitationLog[]> {
    const logs = Array.from(this.invitationLogs.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(offset, offset + limit);
    return logs;
  }

  async getSystemStats(): Promise<SystemStats | undefined> {
    return this.systemStats;
  }

  async updateSystemStats(stats: Partial<InsertSystemStats>): Promise<SystemStats> {
    this.systemStats = {
      ...this.systemStats,
      ...stats,
      lastUpdated: new Date(),
    };
    return this.systemStats;
  }

  async incrementInviteCount(status: 'success' | 'failed'): Promise<void> {
    this.systemStats.totalInvites = (this.systemStats.totalInvites || 0) + 1;
    if (status === 'success') {
      this.systemStats.successfulInvites = (this.systemStats.successfulInvites || 0) + 1;
    } else {
      this.systemStats.failedInvites = (this.systemStats.failedInvites || 0) + 1;
    }
    this.systemStats.lastUpdated = new Date();
  }
}

export const storage = new MemStorage();
