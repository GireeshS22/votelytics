"""
Delete 2016 election record (no results loaded yet)
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import Election, ElectionResult

db = SessionLocal()

try:
    # Find 2016 election
    election_2016 = db.query(Election).filter(Election.year == 2016).first()

    if election_2016:
        print(f"Found 2016 election (ID: {election_2016.id})")

        # Check if there are any results (shouldn't be any)
        result_count = db.query(ElectionResult).filter(
            ElectionResult.year == 2016
        ).count()

        print(f"Associated results: {result_count}")

        # Delete results first (if any)
        if result_count > 0:
            db.query(ElectionResult).filter(ElectionResult.year == 2016).delete()
            print(f"Deleted {result_count} results")

        # Delete election
        db.delete(election_2016)
        db.commit()

        print("[SUCCESS] Deleted 2016 election record")
        print("You can now run load_2016_data.py to reload the data")
    else:
        print("No 2016 election found")

except Exception as e:
    print(f"[ERROR] {e}")
    db.rollback()
finally:
    db.close()
