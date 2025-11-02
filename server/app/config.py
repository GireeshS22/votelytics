"""
Configuration settings for Votelytics API
Uses pydantic-settings to load from environment variables
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Environment
    ENV: str = "development"  # development, staging, production

    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/votelytics"

    # API settings
    API_V1_PREFIX: str = "/api"
    PROJECT_NAME: str = "Votelytics API"

    # CORS settings - origins allowed to call the API
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite alternative port
        "http://localhost:5175",  # Vite alternative port
        "http://localhost:5176",  # Vite alternative port
        "http://localhost:3000",  # Alternative frontend port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:3000",
    ]

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ADMIN_API_KEY: str = ""  # Required for write operations (POST/PUT/DELETE)

    # Rate limiting
    RATE_LIMIT_PUBLIC: str = "100/minute"  # Public read endpoints
    RATE_LIMIT_ADMIN: str = "500/minute"   # Admin write endpoints
    RATE_LIMIT_HEAVY: str = "20/minute"    # Heavy queries (all election results)

    # Supabase settings (optional - for future features like auth, storage)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""

    @field_validator("ADMIN_API_KEY")
    @classmethod
    def validate_admin_key(cls, v: str, info) -> str:
        """Validate that ADMIN_API_KEY is set in non-development environments"""
        env = info.data.get("ENV", "development")

        if env == "development" and not v:
            # In development, warn but allow empty key for initial setup
            print("WARNING: ADMIN_API_KEY not set. Write endpoints will be unprotected!")
            return v

        if env in ["production", "staging"] and not v:
            raise ValueError(
                "ADMIN_API_KEY must be set in production/staging environments. "
                "Generate one with: python -c \"import secrets; print('admin_' + secrets.token_urlsafe(32))\""
            )

        if v and len(v) < 20:
            raise ValueError(
                "ADMIN_API_KEY must be at least 20 characters long for security. "
                "Generate a secure key with: python -c \"import secrets; print('admin_' + secrets.token_urlsafe(32))\""
            )

        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
