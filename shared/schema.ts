import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topic: text("topic"),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  eyeContactPercentage: real("eye_contact_percentage").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  wordsPerMinute: real("words_per_minute").notNull(),
  fillerWordsCount: integer("filler_words_count").notNull(),
  transcript: text("transcript"),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  improvements: jsonb("improvements").$type<string[]>().notNull(),
  eyeContactData: jsonb("eye_contact_data").$type<{ timestamp: number; hasEyeContact: boolean }[]>().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
