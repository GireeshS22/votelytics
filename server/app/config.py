"""
Configuration settings for Votelytics API
Uses pydantic-settings to load from environment variables
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/votelytics"

    # API settings
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Votelytics API"

    # CORS settings - origins allowed to call the API
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative frontend port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Supabase settings (optional - for future features like auth, storage)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
