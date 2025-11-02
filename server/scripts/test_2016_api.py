"""
Test if API can return 2016 data
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import Election, ElectionResult

db = SessionLocal()

try:
    # Find 2016 election ID
    election_2016 = db.query(Election).filter(Election.year == 2016).first()

    if election_2016:
        print(f"2016 Election ID: {election_2016.id}")
        print(f"Name: {election_2016.name}")

        # Sample a few winners
        winners = db.query(ElectionResult).filter(
            ElectionResult.election_id == election_2016.id,
            ElectionResult.is_winner == 1
        ).limit(5).all()

        print(f"\nSample 2016 Winners (first 5):")
        for w in winners:
            print(f"  AC {w.ac_number} {w.ac_name}: {w.candidate_name} ({w.party}) - {w.total_votes:,} votes")

        print(f"\nAPI endpoint to test:")
        print(f"  GET /api/elections/{election_2016.id}/results?winner_only=true&limit=500")

    # Also show 2021 for comparison
    election_2021 = db.query(Election).filter(Election.year == 2021).first()
    if election_2021:
        print(f"\n2021 Election ID: {election_2021.id}")
        print(f"  Current frontend uses: /api/elections/{election_2021.id}/results")

finally:
    db.close()
