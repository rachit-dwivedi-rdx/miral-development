import { sessions, users, type Session, type InsertSession, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  createSession(topic: string, userId?: string): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(userId?: string): Promise<Session[]>;
  getUserSessions(userId: string): Promise<Session[]>;
  updateSession(id: string, data: any): Promise<Session>;
  createUser(email: string, password: string, name?: string): Promise<User>;
  getUser(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createSession(topic: string, userId?: string): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values({
        topic,
        userId,
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

  async getAllSessions(userId?: string): Promise<Session[]> {
    if (userId) {
      return this.getUserSessions(userId);
    }
    const allSessions = await db.select().from(sessions).orderBy(desc(sessions.createdAt));
    return allSessions;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(desc(sessions.createdAt));
    return userSessions;
  }

  async updateSession(id: string, data: any): Promise<Session> {
    const [session] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async createUser(email: string, password: string, name?: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning();
    return user;
  }

  async getUser(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }
}

export const storage = new DatabaseStorage();
