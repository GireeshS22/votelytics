"""Create public_votes table"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import engine, Base
from app.models.vote import PublicVote  # noqa: F401 — registers the model

Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables['public_votes']])
print("✅ public_votes table created (or already exists)")
