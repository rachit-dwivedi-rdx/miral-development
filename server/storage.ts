import { sessions, type Session, type InsertSession } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createSession(topic: string): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  updateSession(id: string, data: {
    duration?: number;
    eyeContactPercentage?: number;
    confidenceScore?: number;
    wordsPerMinute?: number;
    fillerWordsCount?: number;
    transcript?: string | null;
    strengths?: string[];
    improvements?: string[];
    eyeContactData?: { timestamp: number; hasEyeContact: boolean }[];
  }): Promise<Session>;
}

export class DatabaseStorage implements IStorage {
  async createSession(topic: string): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        topic,
        duration: 0,
        eyeContactPercentage: 0,
        confidenceScore: 0,
        wordsPerMinute: 0,
        fillerWordsCount: 0,
        transcript: '',
        strengths: [],
        improvements: [],
        eyeContactData: [],
      })
      .returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async getAllSessions(): Promise<Session[]> {
    const allSessions = await db.select().from(sessions).orderBy(desc(sessions.createdAt));
    return allSessions;
  }

  async updateSession(id: string, data: {
    duration?: number;
    eyeContactPercentage?: number;
    confidenceScore?: number;
    wordsPerMinute?: number;
    fillerWordsCount?: number;
    transcript?: string | null;
    strengths?: string[];
    improvements?: string[];
    eyeContactData?: { timestamp: number; hasEyeContact: boolean }[];
  }): Promise<Session> {
    const [session] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }
}

export const storage = new DatabaseStorage();
