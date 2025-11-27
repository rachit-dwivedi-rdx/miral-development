import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { transcribeAudio } from "./openai";
import {
  detectFillerWords,
  calculateWordsPerMinute,
  generateConfidenceScore,
  generateStrengths,
  generateImprovements,
} from "@shared/audio-utils";
import fs from "fs/promises";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const existingUser = await storage.getUser(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const user = await storage.createUser(email, password, name);
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      console.error('Error in signup:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const user = await storage.getUser(email);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      console.error('Error in login:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const { topic, userId } = req.body;
      const session = await storage.createSession(topic || 'Untitled Session', userId);
      res.json(session);
    } catch (error: any) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions", async (req, res) => {
    try {
      const { userId } = req.query;
      const sessions = await storage.getAllSessions(userId as string | undefined);
      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const session = await storage.getSession(id);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json(session);
    } catch (error: any) {
      console.error('Error fetching session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions/:id/complete", upload.single('audio'), async (req, res) => {
    let uploadedFilePath: string | null = null;
    
    try {
      const { id } = req.params;
      
      const duration = parseInt(req.body.duration);
      if (isNaN(duration) || duration < 0) {
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: 'Invalid duration' });
      }
      
      let eyeContactData: { timestamp: number; hasEyeContact: boolean }[] = [];
      try {
        eyeContactData = JSON.parse(req.body.eyeContactData);
        if (!Array.isArray(eyeContactData)) {
          throw new Error('eyeContactData must be an array');
        }
      } catch (error) {
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ error: 'Invalid eyeContactData format' });
      }
      
      const session = await storage.getSession(id);
      if (!session) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(404).json({ error: 'Session not found' });
      }

      let transcript = '';
      let fillerWordsCount = 0;
      let wordsPerMinute = 0;
      let transcriptionError: string | null = null;

      if (req.file) {
        uploadedFilePath = req.file.path;
        
        if (!process.env.OPENAI_API_KEY) {
          transcriptionError = 'OpenAI API key not configured';
          console.warn('Skipping transcription: OpenAI API key not configured');
        } else {
          try {
            transcript = await transcribeAudio(req.file.path);
            const fillerWords = detectFillerWords(transcript);
            fillerWordsCount = fillerWords.reduce((sum, fw) => sum + fw.count, 0);
            wordsPerMinute = calculateWordsPerMinute(transcript, duration);
          } catch (error: any) {
            transcriptionError = error.message;
            console.error('Error transcribing audio:', error);
          }
        }
        
        await fs.unlink(req.file.path).catch(err => {
          console.error('Error deleting uploaded file:', err);
        });
        uploadedFilePath = null;
      }

      const eyeContactPercentage = eyeContactData.length > 0
        ? Math.round((eyeContactData.filter((d: any) => d.hasEyeContact).length / eyeContactData.length) * 100)
        : 0;

      const confidenceScore = generateConfidenceScore(
        eyeContactPercentage,
        wordsPerMinute,
        fillerWordsCount,
        duration
      );

      const strengths = generateStrengths(
        eyeContactPercentage,
        wordsPerMinute,
        fillerWordsCount,
        duration
      );

      const improvements = generateImprovements(
        eyeContactPercentage,
        wordsPerMinute,
        fillerWordsCount
      );

      const updatedSession = await storage.updateSession(id, {
        duration,
        eyeContactPercentage,
        confidenceScore,
        wordsPerMinute,
        fillerWordsCount,
        transcript: transcript || null,
        strengths,
        improvements,
        eyeContactData,
      });

      res.json({
        session: updatedSession,
        transcriptionError,
      });
    } catch (error: any) {
      console.error('Error completing session:', error);
      
      if (uploadedFilePath) {
        await fs.unlink(uploadedFilePath).catch(() => {});
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
