"""
Migration script: Add version column to predictions table
Existing predictions will default to version=1
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


def add_version_column():
    """Add version column to predictions table"""
    print("Adding 'version' column to predictions table...")

    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'predictions' AND column_name = 'version'
        """))

        if result.fetchone():
            print("Column 'version' already exists. Skipping.")
            return True

        # Add version column with default value 1
        conn.execute(text("""
            ALTER TABLE predictions
            ADD COLUMN version INTEGER NOT NULL DEFAULT 1
        """))

        # Create index for faster queries
        conn.execute(text("""
            CREATE INDEX ix_predictions_version ON predictions (version)
        """))

        conn.commit()

        print("[SUCCESS] Added 'version' column with default=1")
        print("[SUCCESS] Created index on 'version' column")

        # Show count of predictions now at version 1
        result = conn.execute(text("SELECT COUNT(*) FROM predictions WHERE version = 1"))
        count = result.scalar()
        print(f"\nExisting predictions updated: {count} records now at version=1")

    return True


if __name__ == "__main__":
    add_version_column()
