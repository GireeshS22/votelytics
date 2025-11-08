"""
Migration script to add ac_code column to election_results table
and populate it from constituencies table
"""
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine, SessionLocal


def add_ac_code_column():
    """Add ac_code column to election_results table and populate it"""

    with engine.connect() as conn:
        # Step 1: Add the ac_code column if it doesn't exist
        print("Step 1: Adding ac_code column to election_results table...")
        try:
            conn.execute(text("""
                ALTER TABLE election_results
                ADD COLUMN ac_code VARCHAR(10);
            """))
            conn.commit()
            print("[OK] Column added successfully")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("[OK] Column already exists, skipping...")
                conn.rollback()
            else:
                raise

        # Step 2: Create index on ac_code
        print("\nStep 2: Creating index on ac_code...")
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_election_results_ac_code
                ON election_results (ac_code);
            """))
            conn.commit()
            print("[OK] Index created successfully")
        except Exception as e:
            print(f"Warning: {e}")

        # Step 3: Populate ac_code from constituencies table
        print("\nStep 3: Populating ac_code from constituencies table...")
        result = conn.execute(text("""
            UPDATE election_results
            SET ac_code = (
                SELECT code
                FROM constituencies
                WHERE constituencies.id = election_results.constituency_id
            )
            WHERE ac_code IS NULL;
        """))
        conn.commit()
        print(f"[OK] Updated {result.rowcount} records")

        # Step 4: Verify the update
        print("\nStep 4: Verifying the update...")
        result = conn.execute(text("""
            SELECT
                COUNT(*) as total,
                COUNT(ac_code) as with_code,
                COUNT(*) - COUNT(ac_code) as missing_code
            FROM election_results;
        """))
        row = result.fetchone()
        print(f"[OK] Total records: {row[0]}")
        print(f"[OK] Records with ac_code: {row[1]}")
        print(f"[OK] Records missing ac_code: {row[2]}")

        # Step 5: Show sample data
        print("\nStep 5: Sample data:")
        result = conn.execute(text("""
            SELECT ac_number, ac_name, ac_code, party, year
            FROM election_results
            WHERE ac_code IS NOT NULL
            LIMIT 5;
        """))
        for row in result:
            print(f"  AC {row[0]}: {row[1]} (code: {row[2]}) - {row[3]} ({row[4]})")

    print("\n[SUCCESS] Migration completed successfully!")


if __name__ == "__main__":
    add_ac_code_column()
