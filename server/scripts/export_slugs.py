"""
Export constituency slugs to JSON for sitemap generation
"""
import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine


def export_slugs():
    """Export constituency slugs to JSON file"""

    with engine.connect() as conn:
        # Fetch all constituency slugs
        result = conn.execute(text("""
            SELECT slug FROM constituencies
            WHERE slug IS NOT NULL
            ORDER BY ac_number;
        """))

        slugs = [row[0] for row in result]

        # Write to JSON file
        output_file = Path(__file__).parent.parent.parent / 'client' / 'public' / 'constituency-slugs.json'

        with open(output_file, 'w') as f:
            json.dump({'slugs': slugs}, f, indent=2)

        print(f"[OK] Exported {len(slugs)} constituency slugs to {output_file}")

        return slugs


if __name__ == "__main__":
    export_slugs()
