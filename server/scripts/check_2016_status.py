"""
Check status of 2016 election data in database
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import Election, ElectionResult

db = SessionLocal()

try:
    # Check 2016 election
    election_2016 = db.query(Election).filter(Election.year == 2016).first()

    if election_2016:
        print(f"[OK] 2016 Election exists (ID: {election_2016.id})")
        print(f"  Name: {election_2016.name}")
        print(f"  Date: {election_2016.election_date}")

        # Count results
        result_count = db.query(ElectionResult).filter(
            ElectionResult.year == 2016
        ).count()

        winner_count = db.query(ElectionResult).filter(
            ElectionResult.year == 2016,
            ElectionResult.is_winner == 1
        ).count()

        print(f"\n2016 Election Results:")
        print(f"  Total candidates: {result_count}")
        print(f"  Winners: {winner_count}")
        print(f"\nExpected: 4010 candidates, 234 winners")

        if result_count == 0:
            print("\n[ISSUE] Election record exists but NO results loaded!")
            print("Action needed: Delete 2016 election record and reload")
        elif result_count < 4010:
            print(f"\n[ISSUE] Partial data - only {result_count} of 4010 candidates loaded")
            print("Action needed: Delete 2016 election record and reload")
        else:
            print("\n[SUCCESS] 2016 data appears complete!")
    else:
        print("No 2016 election found in database")

finally:
    db.close()
