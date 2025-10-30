"""Quick test script to verify Supabase database connection"""
from app.database import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()
        print("[SUCCESS] Database connection successful!")
        print(f"PostgreSQL version: {version[0]}")
except Exception as e:
    print(f"[ERROR] Database connection failed: {e}")
