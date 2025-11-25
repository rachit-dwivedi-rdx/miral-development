# MIRAL - AI Mirror for Public Speaking

## Overview

MIRAL is an AI-powered practice tool for public speaking and presentations. The application uses real-time webcam and audio analysis to provide feedback on eye contact, facial expressions, posture, voice patterns, and speech clarity. Users practice speeches while receiving live feedback, then review detailed performance reports with metrics, strengths, and improvement suggestions.

The system is designed as a "virtual practice partner" for interviews, presentations, meetings, and public speaking scenarios.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing (Practice, Dashboard, Report pages)
- TailwindCSS for utility-first styling with custom design tokens

**UI Component System**
- shadcn/ui components (Radix UI primitives) for accessible, customizable interfaces
- Design system inspired by Linear/Notion with focus on clarity and minimal distraction
- Custom theme system supporting light/dark modes via context provider
- Typography: Inter font for UI, JetBrains Mono for numeric/monospace data

**State Management**
- TanStack Query (React Query) for server state management and caching
- Local React state for component-level UI state
- Custom hooks pattern for reusable logic (webcam, audio recording, face detection)

**Real-time Analysis**
- TensorFlow.js with MediaPipe FaceMesh for browser-based face landmark detection
- Custom eye contact calculation algorithm analyzing face keypoints
- Audio recording using MediaRecorder API (WebRTC)
- Interval-based analysis loops during practice sessions

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for API endpoints
- Development mode uses Vite middleware for SSR
- Production mode serves static build artifacts
- Custom logging middleware for request/response tracking

**API Design**
- RESTful endpoints for session management:
  - POST `/api/sessions` - Create new practice session
  - GET `/api/sessions` - List all sessions
  - GET `/api/sessions/:id` - Get session details
  - PUT `/api/sessions/:id` - Update session with results
  - POST `/api/sessions/:id/analyze` - Upload and analyze audio
- Multer middleware for handling audio file uploads
- JSON request/response format

**Audio Processing Pipeline**
1. Client records audio using MediaRecorder (WebM format)
2. File uploaded to server via multipart/form-data
3. Server stores temporarily in uploads directory
4. Audio transcribed using OpenAI Whisper API
5. Transcript analyzed for filler words, WPM, confidence score
6. Results saved to database, temporary file cleaned up

**Analysis Utilities** (shared/audio-utils.ts)
- Filler word detection using regex pattern matching
- Words-per-minute calculation from transcript and duration
- Confidence scoring algorithm combining:
  - Eye contact percentage (0-20 points)
  - Speaking pace/WPM (0-15 points)
  - Filler word frequency (0-15 points)
- AI-generated strengths and improvements using structured prompts

### Data Storage

**Database**
- PostgreSQL via Neon serverless driver
- Drizzle ORM for type-safe database operations
- Connection pooling for efficient query execution

**Schema Design** (shared/schema.ts)
- Single `sessions` table with columns:
  - id (UUID, auto-generated)
  - topic (text)
  - duration (integer, seconds)
  - createdAt (timestamp)
  - eyeContactPercentage (real)
  - confidenceScore (real)
  - wordsPerMinute (real)
  - fillerWordsCount (integer)
  - transcript (text, nullable)
  - strengths (JSONB array)
  - improvements (JSONB array)
  - eyeContactData (JSONB array of timestamp/boolean objects)

**Data Flow**
- Sessions created with default/zero values on practice start
- Real-time eye contact data accumulated during recording
- Full metrics calculated and saved after practice completion
- Historical sessions queried for dashboard statistics and trends

### External Dependencies

**AI & Machine Learning Services**
- **OpenAI API**: Whisper model for speech-to-text transcription, GPT models for generating personalized feedback (strengths/improvements)
- **TensorFlow.js**: Browser-based ML runtime
- **MediaPipe FaceMesh**: Pre-trained model for facial landmark detection (468 keypoints)

**Database**
- **Neon PostgreSQL**: Serverless PostgreSQL with WebSocket support for edge deployments
- **Drizzle Kit**: Schema migrations and database pushing

**Third-party UI Libraries**
- **Radix UI**: Headless component primitives (20+ components including Dialog, Dropdown, Tabs, Toast)
- **Recharts**: React charting library for visualizing progress/trends on dashboard
- **Lucide React**: Icon library for consistent iconography

**Development Tools**
- **Replit plugins**: Runtime error overlay, cartographer, dev banner for Replit environment
- **date-fns**: Date formatting and manipulation utilities
- **class-variance-authority**: Type-safe variant API for component styling
- **react-hook-form + zod**: Form validation and type-safe schemas

**Build & Runtime**
- **esbuild**: Fast JavaScript bundler for production server build
- **tsx**: TypeScript execution for development server
- **ws**: WebSocket client for Neon database connections