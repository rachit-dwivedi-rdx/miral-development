# MIRAL - AI Mirror for Public Speaking Confidence

**An intelligent AI-powered platform that analyzes your public speaking in real-time using computer vision and speech analysis.**

![MIRAL](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Features

### Real-Time Analysis
- **Eye Contact Detection** - Live feedback on eye contact percentage using TensorFlow.js face detection
- **Body Posture Analysis** - Real-time posture scoring with shoulder alignment, head position, and back straightness detection
- **Speech Transcription** - OpenAI Whisper integration for accurate speech-to-text
- **Filler Word Detection** - Identifies and counts filler words ("um", "uh", "like") for improvement

### Practice Modes
- **6 Professional Scenarios** - Job interviews, presentations, sales pitches, public speaking, networking, award speeches
- **Live Metrics Dashboard** - Real-time display of eye contact, posture, duration, and status
- **AI-Powered Feedback** - Personalized coaching based on performance metrics

### Learning Resources
- **10 Curated Resources** - TED Talks, Toastmasters guides, Psychology Today articles, MindTools courses
- **Structured Learning Path** - Week-by-week progression from beginner to advanced
- **External Resource Links** - Direct access to YouTube videos and articles from industry experts

### Analytics & Progress
- **Detailed Performance Reports** - Eye contact %, posture score, confidence score, words per minute, filler words
- **Session Comparisons** - Track improvement across multiple practice sessions
- **User Profiles** - Personal statistics, progress tracking, data export capabilities

### Authentication & User Management
- **Secure Login/Signup** - bcryptjs password hashing, PostgreSQL user storage
- **User-Scoped Data** - Each user sees only their own sessions and analytics
- **Session Persistence** - All data automatically saved to PostgreSQL database

## 🚀 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with shadcn components
- **Wouter** - Client-side routing
- **TanStack Query (React Query)** - Data fetching and caching
- **Framer Motion** - Animations

### Backend
- **Express.js** - Web server
- **Node.js** - JavaScript runtime
- **PostgreSQL** - Database (Neon)
- **Drizzle ORM** - Database management

### AI/ML
- **TensorFlow.js** - Browser-based ML
- **@tensorflow-models/face-landmarks-detection** - Face and eye tracking
- **@tensorflow-models/pose-detection** - Body posture analysis
- **OpenAI Whisper API** - Speech transcription

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL database
- OpenAI API key (for speech transcription)

## 🔧 Local Setup

### 1. Clone Repository
```bash
git clone <your-github-url>
cd MIRAL
npm install
```

### 2. Environment Variables
Create `.env.local` file:
```
VITE_API_URL=http://localhost:5000
OPENAI_API_KEY=your_openai_key_here
DATABASE_URL=your_postgres_url
```

### 3. Database Setup
```bash
npm run db:push
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5000` in your browser.

## 📁 Project Structure

```
├── client/
│   └── src/
│       ├── pages/          # React pages (Practice, Dashboard, Report, etc.)
│       ├── components/     # Reusable UI components
│       ├── lib/           # Utilities (face-detection, posture-detection)
│       └── hooks/         # Custom React hooks
├── server/
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   └── openai.ts          # OpenAI integration
├── shared/
│   ├── schema.ts          # Database schema + types
│   └── audio-utils.ts     # Audio analysis utilities
└── package.json
```

## 🎮 User Flow

1. **Create Account** → Sign up with email/password
2. **Login** → Access your personal dashboard
3. **Choose Practice Mode** → Select from 6 scenarios or start custom session
4. **Record Session** → Real-time AI feedback on eye contact and posture
5. **View Results** → Detailed analytics and improvement suggestions
6. **Learn Resources** → Access curated learning content
7. **Track Progress** → Compare metrics across sessions

## 📊 Performance Metrics

### Eye Contact
- Tracks gaze direction toward camera
- Displays percentage of time with good eye contact
- Provides real-time alerts when attention drifts

### Posture Score
- Analyzes shoulder alignment (±35px tolerance)
- Checks head position relative to shoulders
- Evaluates back straightness based on hip-shoulder alignment
- Provides personalized improvement suggestions

### Speech Analysis
- Words per minute (WPM)
- Filler words count
- Confidence score (combination of all metrics)

## 🚀 Deployment

### Deploy to Replit (Production)
1. Click **Publish** button in Replit
2. App will be live at `https://[replit-slug].replit.dev`

### Deploy to Netlify/Vercel (Frontend)
```bash
npm run build
# Deploy the dist/ folder
```

### Deploy to Railway/Heroku (Backend)
1. Push to GitHub
2. Connect GitHub to Railway/Heroku
3. Set environment variables
4. Deploy automatically

## 🔐 Security

- **Password Hashing** - bcryptjs (10 salt rounds)
- **User Isolation** - Each user sees only their own data
- **HTTPS** - All connections encrypted
- **API Keys** - Stored securely in environment variables

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: Requires camera/microphone access for full functionality

## 🎓 Learning Outcomes

Users learn:
- Importance of eye contact in communication
- Body language and posture for confidence
- Eliminating filler words and improving pacing
- Transcribing and analyzing their own speech
- Tracking improvement over multiple sessions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 👥 Team

Built for hackathon submission. Contributors welcome!

## 📞 Support

For issues and questions, please open a GitHub issue or contact the team.

## 🙏 Acknowledgments

- TensorFlow.js team for ML models
- OpenAI for Whisper API
- Shadcn for component library
- Tailwind CSS for styling

---

**Ready to improve your public speaking? Start practicing today with MIRAL! 🎤**
