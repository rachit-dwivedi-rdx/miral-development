# MIRAL - Hackathon Submission Package

## 📋 Submission Requirements Checklist

### 1. Source Code Repository (GitHub URL)
**Status**: Ready to push

```
GitHub URL: [You will provide after pushing]
```

**How to push to GitHub:**

```bash
# 1. Create new repository on GitHub (don't add README)
# 2. From your Replit terminal or local machine:

cd /home/runner/workspace
git add .
git commit -m "MIRAL: AI Mirror for Public Speaking Confidence - Hackathon Submission"
git branch -M main
git remote set-url origin https://github.com/YOUR-USERNAME/MIRAL.git
git push -u origin main
```

**Repository Contents:**
- ✅ Full source code with TypeScript
- ✅ Database schema and migrations
- ✅ Environment configuration template
- ✅ Package management (npm)
- ✅ README.md with setup instructions

---

### 2. Demo Video (3-5 Minutes)

**Video Should Show:**

#### Part 1: Authentication (0:00-0:30)
- Show signup page with new account creation
- Show login page
- Show successful redirect to dashboard

#### Part 2: Practice Mode (0:30-2:00)
- Click "Practice" or "Scenarios"
- Select a practice scenario
- Show webcam feed activating
- Enter a topic
- Start recording and demonstrate:
  - Live eye contact metric updating
  - Posture score updating in real-time
  - Feedback alerts appearing
  - Duration timer running
- Stop after ~30 seconds

#### Part 3: Results Report (2:00-3:30)
- Show the results page loading
- Highlight all 5 metrics:
  - Eye Contact %
  - Posture Score
  - Words Per Minute
  - Filler Words Count
  - Duration
- Show strengths and improvements sections
- Show comparison with previous sessions
- Mention the database storing results

#### Part 4: Learning Resources (3:30-4:00)
- Navigate to Learning page
- Show resource cards
- Click one resource and show it opens correctly

#### Part 5: Dashboard (4:00-4:30)
- Show user dashboard with session history
- Show progress charts
- Show profile

#### Part 6: Key Features (4:30-5:00)
- Highlight the AI-powered analysis
- Mention real-time detection
- Note the complete analytics
- Show user authentication working

**Recording Tips:**
- Use OBS, Loom, or ScreenFlow
- Clear audio is important
- Show smooth interactions
- Mention the tech stack briefly

**Upload Video to:**
- YouTube (unlisted or public)
- Loom
- Vimeo
- Google Drive

---

### 3. Live Project URL / Deployment Link

**Option A: Deploy on Replit (EASIEST)**
```
1. Click "Publish" button in Replit UI
2. Get live URL instantly
3. Share URL: https://[your-project-name].replit.dev
```

**Option B: Deploy on Netlify**
```bash
# Build the frontend
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Option C: Deploy on Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option D: Deploy on Railway**
1. Connect GitHub repository
2. Railway auto-deploys from main branch
3. Get production URL

---

### 4. Supporting Documents (Optional but Recommended)

#### A. Project Overview Document
```markdown
# MIRAL Project Overview

## Problem Statement
Many people struggle with public speaking and lack real-time feedback on their performance. 
Existing solutions are expensive or require in-person coaching.

## Solution
MIRAL provides AI-powered real-time analysis of:
- Eye contact patterns
- Body posture and alignment
- Speech pace and filler words
- Overall confidence scoring

## Innovation
- Real-time TensorFlow.js-based computer vision analysis
- Browser-based (no server uploads needed for immediate feedback)
- Combines multiple AI models for comprehensive analysis
- User-friendly interface with actionable insights

## Target Users
- Job interview candidates
- Public speakers and presenters
- Sales professionals
- Students
- Anyone wanting to improve communication skills

## Business Model (Optional)
- Freemium: Basic practice mode free
- Premium: Unlimited practice + advanced analytics
- B2B: Corporate training packages
```

#### B. Technical Architecture Document
```markdown
# Technical Architecture

## Frontend
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- Real-time state management with React hooks
- TensorFlow.js for browser-based ML

## Backend
- Express.js REST API
- PostgreSQL database
- Drizzle ORM for type-safe queries
- OpenAI Whisper for speech transcription

## AI/ML Pipeline
1. **Video Input** → HTMLVideoElement from webcam
2. **Face Detection** → MediaPipe Face Mesh (TensorFlow.js)
3. **Pose Detection** → BlazePose (TensorFlow.js)
4. **Eye Contact Analysis** → Keypoint geometry
5. **Posture Analysis** → Shoulder/hip alignment
6. **Audio Processing** → Web Audio API
7. **Transcription** → OpenAI Whisper API

## Data Flow
User → Webcam → TensorFlow Models → Real-time Analysis → Display Results → Store in DB

## Performance Optimization
- Model caching in browser
- Efficient keypoint sampling
- Batched database operations
- Progressive image loading
```

#### C. Feature List
```markdown
# MIRAL Features

## Core Features
✅ Real-time eye contact detection
✅ Posture analysis and scoring
✅ Speech transcription (OpenAI Whisper)
✅ Filler word detection
✅ Confidence scoring
✅ Session recording and playback
✅ Performance analytics

## User Features
✅ User authentication (signup/login)
✅ Multiple practice scenarios
✅ Customizable practice sessions
✅ Personal dashboard
✅ Session history
✅ Progress tracking
✅ Performance comparisons
✅ User profile management

## Learning Features
✅ 10 curated learning resources
✅ Expert-sourced content
✅ Progressive learning path
✅ External resource links

## Technical Features
✅ Responsive design (mobile + desktop)
✅ Dark mode support
✅ Real-time feedback
✅ Data persistence (PostgreSQL)
✅ Secure authentication
✅ User data isolation
```

#### D. Installation & Setup Guide
```markdown
# Setup Instructions

## Local Development

1. Clone repo
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start dev server: `npm run dev`
5. Visit http://localhost:5000

## Production Deployment

See README.md for detailed deployment instructions.
```

---

## 📝 Submission Checklist

- [ ] Code pushed to GitHub (public repository)
- [ ] README.md includes setup instructions
- [ ] Live demo link working and accessible
- [ ] Demo video uploaded (3-5 minutes)
- [ ] All dependencies listed in package.json
- [ ] Environment variables documented
- [ ] License file included (MIT)
- [ ] CONTRIBUTING guide (optional)
- [ ] Code is clean and well-commented
- [ ] No hardcoded secrets in repository
- [ ] Database is functioning on live deployment
- [ ] All features working in live deployment

---

## 🎯 Pitch Summary

**MIRAL - AI Mirror for Public Speaking Confidence**

A real-time AI coaching platform that helps users master public speaking through intelligent computer vision and speech analysis. Users practice with 6 professional scenarios, receive instant feedback on eye contact and posture, track progress through detailed analytics, and access curated learning resources from industry experts.

**Key Differentiators:**
- ✨ Real-time AI feedback (not recorded feedback)
- 🎯 Multiple practice scenarios for different use cases
- 📊 Comprehensive analytics (eye contact + posture + speech)
- 🎓 Integrated learning resources
- 🔐 Secure user authentication with data persistence
- 📱 Fully responsive design

---

## 📞 Support

For questions about submission format or deployment, check:
- GitHub repository README
- Environment setup guide
- Live demo functionality

---

## 🎉 Final Submission

**To Submit:**

1. **Fill this out:**
   ```
   Project Name: MIRAL
   GitHub URL: https://github.com/YOUR-USERNAME/MIRAL
   Live URL: https://[deployment-link]
   Demo Video: [YouTube/Loom link]
   ```

2. **Submit to hackathon platform with:**
   - GitHub repository link
   - Live deployment link
   - Demo video link
   - Supporting documents (optional)

**Good luck with your hackathon submission! 🚀**
