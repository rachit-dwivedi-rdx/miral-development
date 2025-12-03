# server-fastapi/app.py
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from datetime import datetime
import time

from routes import router
from config import settings
from database import engine, Base
from models import User, Session  # Import models to register them

def create_app() -> FastAPI:
    """
    Create and configure FastAPI application
    """
    app = FastAPI(
        title="MiralAI API",
        description="Confidence Building & Public Speaking Practice Platform",
        version="2.0.0",
    )
    
    # CORS middleware - FIX: Use get_cors_list() method
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_cors_list(),  # ← Changed this line
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Custom exception handler for validation errors (422)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """
        Custom handler for 422 validation errors to provide better error messages
        """
        errors = exc.errors()
        error_messages = []
        for error in errors:
            field = ".".join(str(loc) for loc in error.get("loc", []))
            message = error.get("msg", "Validation error")
            error_messages.append(f"{field}: {message}")
        
        error_detail = "; ".join(error_messages) if error_messages else "Validation error"
        print(f"Validation error on {request.url.path}: {error_detail}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "message": error_detail,
                "detail": errors
            }
        )
    
    # Request logging middleware
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start_time = time.time()
        
        # Log request details for API endpoints
        if request.url.path.startswith("/api"):
            formatted_time = datetime.now().strftime("%I:%M:%S %p")
            print(f"{formatted_time} [fastapi] {request.method} {request.url.path}")
        
        response = await call_next(request)
        duration = int((time.time() - start_time) * 1000)
        
        if request.url.path.startswith("/api"):
            formatted_time = datetime.now().strftime("%I:%M:%S %p")
            log_line = f"{formatted_time} [fastapi] {request.method} {request.url.path} {response.status_code} in {duration}ms"
            
            if len(log_line) > 80:
                log_line = log_line[:79] + "…"
            
            print(log_line)
        
        return response
    
    # Include API routes
    app.include_router(router)
    
    # Initialize database tables on startup
    @app.on_event("startup")
    async def init_db():
        """Create database tables if they don't exist"""
        try:
            async with engine.begin() as conn:
                # Create all tables
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Database tables initialized successfully")
        except Exception as e:
            print(f"⚠️  Warning: Could not initialize database tables: {e}")
            print("   Make sure your database is accessible and DATABASE_URL is correct")
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "message": "MiralAI FastAPI Backend",
            "version": "2.0.0",
            "status": "running"
        }
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}
    
    return app
