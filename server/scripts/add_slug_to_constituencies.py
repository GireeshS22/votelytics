"""
Migration script to add slug column to constituencies table
and populate it from constituency names
"""
import sys
import os
import re
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


def slugify(text):
    """Convert text to URL-friendly slug"""
    # Convert to lowercase
    text = text.lower()
    # Replace spaces and special characters with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    # Remove leading/trailing hyphens
    text = text.strip('-')
    return text


def add_slug_column():
    """Add slug column to constituencies table and populate it"""

    with engine.connect() as conn:
        # Step 1: Add the slug column if it doesn't exist
        print("Step 1: Adding slug column to constituencies table...")
        try:
            conn.execute(text("""
                ALTER TABLE constituencies
                ADD COLUMN slug VARCHAR(200);
            """))
            conn.commit()
            print("[OK] Column added successfully")
        except Exception as e:
            if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                print("[OK] Column already exists, skipping...")
                conn.rollback()
            else:
                raise

        # Step 2: Fetch all constituencies
        print("\nStep 2: Fetching constituencies...")
        result = conn.execute(text("""
            SELECT id, name FROM constituencies;
        """))
        constituencies = [(row[0], row[1]) for row in result]
        print(f"[OK] Found {len(constituencies)} constituencies")

        # Step 3: Generate and update slugs
        print("\nStep 3: Generating and updating slugs...")
        updated_count = 0
        for const_id, name in constituencies:
            slug = slugify(name)
            conn.execute(text("""
                UPDATE constituencies
                SET slug = :slug
                WHERE id = :id;
            """), {"slug": slug, "id": const_id})
            updated_count += 1
            if updated_count <= 5:
                print(f"  {name} -> {slug}")

        conn.commit()
        print(f"[OK] Updated {updated_count} constituencies")

        # Step 4: Create unique index on slug
        print("\nStep 4: Creating unique index on slug...")
        try:
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_constituencies_slug
                ON constituencies (slug);
            """))
            conn.commit()
            print("[OK] Index created successfully")
        except Exception as e:
            print(f"Warning: {e}")

        # Step 5: Verify the update
        print("\nStep 5: Verifying slugs...")
        result = conn.execute(text("""
            SELECT
                COUNT(*) as total,
                COUNT(slug) as with_slug,
                COUNT(*) - COUNT(slug) as missing_slug
            FROM constituencies;
        """))
        row = result.fetchone()
        print(f"[OK] Total records: {row[0]}")
        print(f"[OK] Records with slug: {row[1]}")
        print(f"[OK] Records missing slug: {row[2]}")

        # Step 6: Show sample slugs
        print("\nStep 6: Sample slugs:")
        result = conn.execute(text("""
            SELECT ac_number, name, slug
            FROM constituencies
            WHERE slug IS NOT NULL
            ORDER BY ac_number
            LIMIT 10;
        """))
        for row in result:
            print(f"  AC {row[0]}: {row[1]} -> {row[2]}")

    print("\n[SUCCESS] Migration completed successfully!")
    print("\nYou can now access constituencies using:")
    print("  - /api/constituencies/slug/{slug}")
    print("  - Example: /api/constituencies/slug/gummidipoondi")


if __name__ == "__main__":
    add_slug_column()
