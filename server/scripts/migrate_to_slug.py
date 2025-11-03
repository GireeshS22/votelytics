"""
Migration script to replace ac_code with ac_slug in election_results table
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


def migrate_to_slug():
    """Replace ac_code with ac_slug in election_results table"""

    with engine.connect() as conn:
        # Step 1: Add the ac_slug column
        print("Step 1: Adding ac_slug column to election_results table...")
        try:
            conn.execute(text("""
                ALTER TABLE election_results
                ADD COLUMN ac_slug VARCHAR(200);
            """))
            conn.commit()
            print("[OK] Column added successfully")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("[OK] Column already exists, skipping...")
                conn.rollback()
            else:
                raise

        # Step 2: Populate ac_slug from constituencies table
        print("\nStep 2: Populating ac_slug from constituencies table...")
        result = conn.execute(text("""
            UPDATE election_results
            SET ac_slug = (
                SELECT slug
                FROM constituencies
                WHERE constituencies.id = election_results.constituency_id
            )
            WHERE ac_slug IS NULL;
        """))
        conn.commit()
        print(f"[OK] Updated {result.rowcount} records")

        # Step 3: Create index on ac_slug
        print("\nStep 3: Creating index on ac_slug...")
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_election_results_ac_slug
                ON election_results (ac_slug);
            """))
            conn.commit()
            print("[OK] Index created successfully")
        except Exception as e:
            print(f"Warning: {e}")

        # Step 4: Drop ac_code column if it exists
        print("\nStep 4: Removing old ac_code column...")
        try:
            conn.execute(text("""
                ALTER TABLE election_results
                DROP COLUMN IF EXISTS ac_code;
            """))
            conn.commit()
            print("[OK] Old ac_code column removed")
        except Exception as e:
            print(f"Warning: {e}")

        # Step 5: Verify the update
        print("\nStep 5: Verifying ac_slug...")
        result = conn.execute(text("""
            SELECT
                COUNT(*) as total,
                COUNT(ac_slug) as with_slug,
                COUNT(*) - COUNT(ac_slug) as missing_slug
            FROM election_results;
        """))
        row = result.fetchone()
        print(f"[OK] Total records: {row[0]}")
        print(f"[OK] Records with ac_slug: {row[1]}")
        print(f"[OK] Records missing ac_slug: {row[2]}")

        # Step 6: Show sample data
        print("\nStep 6: Sample data:")
        result = conn.execute(text("""
            SELECT ac_number, ac_name, ac_slug, party, year
            FROM election_results
            WHERE ac_slug IS NOT NULL
            ORDER BY ac_number, year DESC
            LIMIT 5;
        """))
        for row in result:
            print(f"  AC {row[0]}: {row[1]} (slug: {row[2]}) - {row[3]} ({row[4]})")

    print("\n[SUCCESS] Migration completed successfully!")
    print("\nElection results now use SEO-friendly slugs:")
    print("  - Example: /constituency/rishivandiyam (instead of /constituency/78)")


if __name__ == "__main__":
    migrate_to_slug()
