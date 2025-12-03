# server-fastapi/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]

    class Config:
        from_attributes = True

# Session schemas
class SessionCreate(BaseModel):
    topic: str
    userId: Optional[str] = None

class SessionResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    topic: Optional[str] = None
    mode: str = 'practice'
    duration: int = 0
    created_at: datetime
    eye_contact_percentage: float = 0.0
    confidence_score: float = 0.0
    words_per_minute: float = 0.0
    filler_words_count: int = 0
    posture_score: float = 0.0
    posture_data: List[Dict[str, Any]] = []
    transcript: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []
    eye_contact_data: List[Dict[str, Any]] = []
    is_public: bool = False

    class Config:
        from_attributes = True

class SessionCompleteResponse(BaseModel):
    session: SessionResponse
    transcriptionError: Optional[str] = None


class LiveFeedbackRequest(BaseModel):
    eyeContactPercentage: float
    postureScore: float
    wordsPerMinute: float = 0
    fillerWordsCount: int = 0
    duration: int
    topic: Optional[str] = "general"
    transcript: Optional[str] = None
    facePosition: Optional[str] = None
    headTilt: Optional[str] = None
    isInFrame: Optional[bool] = True


class LiveFeedbackResponse(BaseModel):
    summary: str
    strengths: List[str]
    improvements: List[str]
    confidence_score: int
    role_specific_tips: List[str]