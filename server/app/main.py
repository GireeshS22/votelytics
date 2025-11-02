"""
Votelytics API - FastAPI Application
Electoral predictions and analysis platform
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.rate_limiters import limiter

# Create FastAPI app instance
app = FastAPI(
    title="Votelytics API",
    description="Electoral predictions and historical election data API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Attach limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - allow frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods only
    allow_headers=["Content-Type", "X-Admin-Key", "Authorization"],  # Explicit headers only
)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Welcome to Votelytics API",
        "status": "active",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Import and include API routers
from app.api import constituencies, elections

app.include_router(
    constituencies.router,
    prefix="/api/constituencies",
    tags=["Constituencies"],
)

app.include_router(
    elections.router,
    prefix="/api/elections",
    tags=["Elections"],
)

# TODO: Add predictions router when ready
# from app.api import predictions
# app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
