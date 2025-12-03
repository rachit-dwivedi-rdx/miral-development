# server-fastapi/routes.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any  # ← Add List, Dict, Any here
import json
import os
import aiofiles

from database import get_db
from storage import storage
from auth import verify_password
from openai_service import transcribe_audio
from audio_utils import (
    detect_filler_words,
    calculate_words_per_minute,
    generate_confidence_score,
)
from ollama_service import generate_feedback
from schemas import (
    UserSignup,
    UserLogin,
    UserResponse,
    SessionCreate,
    SessionResponse,
    SessionCompleteResponse,
    LiveFeedbackRequest,
    LiveFeedbackResponse,
)

router = APIRouter()

# ============ AUTH ROUTES ============

@router.post("/api/auth/signup", response_model=dict)
async def signup(user_data: UserSignup, db: AsyncSession = Depends(get_db)):
    """
    User signup
    Matches: POST /api/auth/signup from routes.ts
    """
    try:
        print(f"📝 Signup request received: email={user_data.email}, name={user_data.name}")
        
        # Validate required fields (Pydantic should handle this, but double-check)
        if not user_data.email or not user_data.password:
            raise HTTPException(status_code=400, detail='Email and password required')
        
        # Check if user exists
        existing_user = await storage.get_user(user_data.email, db)
        if existing_user:
            print(f"❌ User already exists: {user_data.email}")
            raise HTTPException(status_code=400, detail='Email already registered')
        
        # Create user
        print(f"✅ Creating new user: {user_data.email}")
        user = await storage.create_user(
            email=user_data.email,
            password=user_data.password,
            name=user_data.name,
            db=db
        )
        
        print(f"✅ User created successfully: {user.id}")
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f'Error in signup: {e}'
        print(f"❌ {error_msg}")
        print(f'Traceback: {traceback.format_exc()}')
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/auth/login", response_model=dict)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    User login
    Matches: POST /api/auth/login from routes.ts
    """
    try:
        # Validate required fields
        if not user_data.email or not user_data.password:
            raise HTTPException(status_code=400, detail='Email and password required')
        
        # Get user
        user = await storage.get_user(user_data.email, db)
        if not user or not verify_password(user_data.password, user.password):
            raise HTTPException(status_code=401, detail='Invalid credentials')
        
        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f'Error in login: {e}'
        print(error_msg)
        print(f'Traceback: {traceback.format_exc()}')
        raise HTTPException(status_code=500, detail=str(e))

# ============ SESSION ROUTES ============

@router.post("/api/sessions", response_model=SessionResponse)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create new practice session
    Matches: POST /api/sessions from routes.ts
    """
    try:
        session = await storage.create_session(
            topic=session_data.topic or 'Untitled Session',
            user_id=session_data.userId,
            db=db
        )
        return session
    
    except Exception as e:
        print(f'Error creating session: {e}')
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/sessions", response_model=List[SessionResponse])
async def get_sessions(
    userId: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all sessions (optionally filtered by user)
    Matches: GET /api/sessions from routes.ts
    """
    try:
        sessions = await storage.get_all_sessions(userId, db)
        # Ensure we return a list even if empty
        if sessions is None:
            return []
        # FastAPI will automatically convert SQLAlchemy models to Pydantic models
        # using from_attributes=True in the Config
        return list(sessions)
    
    except Exception as e:
        import traceback
        error_msg = f'Error fetching sessions: {e}'
        print(error_msg)
        print(f'Traceback: {traceback.format_exc()}')
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get specific session by ID
    Matches: GET /api/sessions/:id from routes.ts
    """
    try:
        session = await storage.get_session(session_id, db)
        
        if not session:
            raise HTTPException(status_code=404, detail='Session not found')
        
        return session
    
    except HTTPException:
        raise
    except Exception as e:
        print(f'Error fetching session: {e}')
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/sessions/{session_id}/complete", response_model=SessionCompleteResponse)
async def complete_session(
    session_id: str,
    duration: int = Form(...),
    eyeContactData: str = Form(...),
    postureData: str = Form("[]"),
    audio: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Complete session with audio analysis
    Matches: POST /api/sessions/:id/complete from routes.ts
    """
    uploaded_file_path = None
    
    try:
        # Validate duration
        if duration < 0:
            raise HTTPException(status_code=400, detail='Invalid duration')
        
        # Parse JSON data
        try:
            eye_contact_data = json.loads(eyeContactData)
            if not isinstance(eye_contact_data, list):
                raise ValueError('eyeContactData must be an array')
        except Exception:
            raise HTTPException(status_code=400, detail='Invalid eyeContactData format')
        
        try:
            posture_data = json.loads(postureData)
            if not isinstance(posture_data, list):
                raise ValueError('postureData must be an array')
        except Exception:
            raise HTTPException(status_code=400, detail='Invalid postureData format')
        
        # Check if session exists
        session = await storage.get_session(session_id, db)
        if not session:
            raise HTTPException(status_code=404, detail='Session not found')
        
        # Initialize variables
        transcript = ''
        filler_words_count = 0
        words_per_minute = 0
        transcription_error = None
        
        # Process audio if provided
        if audio:
            # Create uploads directory
            upload_dir = "server-fastapi/uploads"
            os.makedirs(upload_dir, exist_ok=True)
            
            # Save uploaded file
            uploaded_file_path = os.path.join(upload_dir, audio.filename)
            
            async with aiofiles.open(uploaded_file_path, 'wb') as f:
                content = await audio.read()
                await f.write(content)
            
            # Always attempt local transcription (Vosk); handle any errors gracefully
            try:
                # Transcribe audio
                transcript = await transcribe_audio(uploaded_file_path)
                
                # Analyze transcript
                filler_words = detect_filler_words(transcript)
                filler_words_count = sum(fw['count'] for fw in filler_words)
                words_per_minute = calculate_words_per_minute(transcript, duration)
            
            except Exception as e:
                transcription_error = str(e)
                print(f'Error transcribing audio: {e}')
            
            # Clean up uploaded file
            if os.path.exists(uploaded_file_path):
                os.remove(uploaded_file_path)
                uploaded_file_path = None
        
        # Calculate eye contact percentage
        eye_contact_percentage = 0
        if len(eye_contact_data) > 0:
            eye_contact_percentage = round(
                (sum(1 for d in eye_contact_data if d.get('hasEyeContact', False)) / len(eye_contact_data)) * 100
            )
        
        # Calculate posture score
        posture_score = 0
        if len(posture_data) > 0:
            posture_score = round(
                sum(p['confidence'] for p in posture_data) / len(posture_data)
            )
        
        # Base confidence score using rule-based metrics
        confidence_score = generate_confidence_score(
            eye_contact_percentage,
            words_per_minute,
            filler_words_count,
            duration
        )

        # === AI feedback via Ollama Gemma:2b ===
        try:
            ollama_result = await generate_feedback(
                eye_contact_pct=eye_contact_percentage,
                posture_score=posture_score,
                wpm=words_per_minute,
                filler_count=filler_words_count,
                duration=duration,
                transcript=transcript or "",
                role=session.topic or "general",
            )

            strengths = ollama_result.get("strengths") or []
            improvements = ollama_result.get("improvements") or []
            confidence_score = int(ollama_result.get("confidence_score") or confidence_score)
        except Exception as e:
            # This should be rare because ollama_service already has its own fallback,
            # but keep a safety net to avoid breaking the API.
            print(f"Error generating Ollama feedback: {e}")
            strengths = []
            improvements = []
        
        # Update session
        update_data = {
            'duration': duration,
            'eye_contact_percentage': eye_contact_percentage,
            'confidence_score': confidence_score,
            'words_per_minute': words_per_minute,
            'filler_words_count': filler_words_count,
            'posture_score': posture_score,
            'posture_data': posture_data,
            'transcript': transcript or None,
            'strengths': strengths,
            'improvements': improvements,
            'eye_contact_data': eye_contact_data,
        }
        
        updated_session = await storage.update_session(session_id, update_data, db)
        
        return {
            "session": updated_session,
            "transcriptionError": transcription_error
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f'Error completing session: {e}')
        
        # Clean up file if error occurred
        if uploaded_file_path and os.path.exists(uploaded_file_path):
            os.remove(uploaded_file_path)
        
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/feedback/live", response_model=LiveFeedbackResponse)
async def live_feedback(metrics: LiveFeedbackRequest):
    """
    Generate near-live AI coaching feedback using current session metrics.
    """
    try:
        topic = metrics.topic or "general"
        base_confidence = generate_confidence_score(
            metrics.eyeContactPercentage,
            metrics.wordsPerMinute,
            metrics.fillerWordsCount,
            metrics.duration
        )

        # Build context string for more dynamic prompts
        context_parts = []
        if not metrics.isInFrame:
            context_parts.append("User is currently OUT OF FRAME")
        elif metrics.facePosition and metrics.facePosition != 'center':
            context_parts.append(f"User is positioned: {metrics.facePosition}")
        if metrics.headTilt and metrics.headTilt != 'straight':
            context_parts.append(f"Head tilt: {metrics.headTilt}")
        
        context = ". ".join(context_parts) if context_parts else "User is well-positioned"

        feedback = await generate_feedback(
            eye_contact_pct=metrics.eyeContactPercentage,
            posture_score=metrics.postureScore,
            wpm=metrics.wordsPerMinute,
            filler_count=metrics.fillerWordsCount,
            duration=metrics.duration,
            transcript=metrics.transcript or "",
            role=topic,
            context=context
        )

        return {
            "summary": feedback.get("summary") or "Keep going – stay focused and confident!",
            "strengths": feedback.get("strengths") or [],
            "improvements": feedback.get("improvements") or [],
            "confidence_score": int(feedback.get("confidence_score") or base_confidence),
            "role_specific_tips": feedback.get("role_specific_tips") or []
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating live feedback: {e}")
        raise HTTPException(status_code=500, detail="Unable to generate live feedback. Please try again.")
