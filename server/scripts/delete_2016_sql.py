"""
Delete 2016 election using raw SQL
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from app.database import engine

print("Deleting 2016 election record...")

try:
    with engine.begin() as conn:
        # Delete any results first (shouldn't be any)
        result1 = conn.execute(text("DELETE FROM election_results WHERE year = 2016"))
        print(f"Deleted {result1.rowcount} election results")

        # Delete election
        result2 = conn.execute(text("DELETE FROM elections WHERE year = 2016"))
        print(f"Deleted {result2.rowcount} election records")

    print("[SUCCESS] 2016 election deleted")
except Exception as e:
    print(f"[ERROR] {e}")
