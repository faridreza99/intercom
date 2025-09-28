import fs from 'fs/promises';
import path from 'path';
import { type InvitationLog } from "@shared/schema";

export class Logger {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 'invites.json');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    const logDir = path.dirname(this.logFilePath);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  async logInvitation(log: InvitationLog): Promise<void> {
    try {
      let existingLogs: InvitationLog[] = [];
      
      try {
        const data = await fs.readFile(this.logFilePath, 'utf-8');
        existingLogs = JSON.parse(data);
      } catch (error) {
        // File doesn't exist or is empty, start with empty array
        existingLogs = [];
      }

      // Add new log to the beginning (most recent first)
      existingLogs.unshift(log);

      // Keep only the last 1000 logs to prevent file from growing too large
      if (existingLogs.length > 1000) {
        existingLogs = existingLogs.slice(0, 1000);
      }

      await fs.writeFile(this.logFilePath, JSON.stringify(existingLogs, null, 2));
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  async getLogs(limit = 50): Promise<InvitationLog[]> {
    try {
      const data = await fs.readFile(this.logFilePath, 'utf-8');
      const logs = JSON.parse(data) as InvitationLog[];
      return logs.slice(0, limit);
    } catch (error) {
      return [];
    }
  }
}

export const logger = new Logger();
