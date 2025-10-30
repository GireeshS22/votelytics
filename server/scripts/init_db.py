"""Initialize database - create all tables"""
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.database import engine, Base
from app.models import Constituency, Election, ElectionResult, Candidate, Prediction


def init_database():
    """Create all database tables"""
    print("Creating database tables...")

    try:
        # Create all tables defined in Base metadata
        Base.metadata.create_all(bind=engine)

        print("[SUCCESS] All tables created successfully!")
        print("\nTables created:")
        print("  - constituencies")
        print("  - elections")
        print("  - election_results")
        print("  - candidates")
        print("  - predictions")

    except Exception as e:
        print(f"[ERROR] Failed to create tables: {e}")
        return False

    return True


if __name__ == "__main__":
    init_database()
