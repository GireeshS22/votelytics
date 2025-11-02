"""
Force drop all tables from Supabase database using SQL
"""
import sys
sys.path.insert(0, '.')

from app.database import engine
from sqlalchemy import text

def force_drop_tables():
    """Drop all tables from Supabase using raw SQL"""
    print("=" * 80)
    print("FORCE DROPPING TABLES FROM SUPABASE DATABASE")
    print("=" * 80)

    with engine.begin() as conn:
        print("\nDropping predictions table...")
        conn.execute(text('DROP TABLE IF EXISTS predictions CASCADE;'))

        print("Dropping election_results table...")
        conn.execute(text('DROP TABLE IF EXISTS election_results CASCADE;'))

        print("Dropping elections table...")
        conn.execute(text('DROP TABLE IF EXISTS elections CASCADE;'))

        print("Dropping candidates table...")
        conn.execute(text('DROP TABLE IF EXISTS candidates CASCADE;'))

        print("Dropping constituencies table...")
        conn.execute(text('DROP TABLE IF EXISTS constituencies CASCADE;'))

    print("\n[OK] All tables ACTUALLY dropped from Supabase!")
    print("=" * 80)

if __name__ == "__main__":
    force_drop_tables()
