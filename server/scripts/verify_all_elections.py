"""
Verify all elections in database
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import func
from app.database import SessionLocal
from app.models.election import Election, ElectionResult


def verify_elections():
    """Show summary of all elections in database"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("ALL ELECTIONS IN DATABASE")
        print("=" * 80)

        elections = db.query(Election).order_by(Election.year.desc()).all()

        for e in elections:
            result_count = db.query(ElectionResult).filter(
                ElectionResult.election_id == e.id
            ).count()

            winner_count = db.query(ElectionResult).filter(
                ElectionResult.election_id == e.id,
                ElectionResult.is_winner == 1
            ).count()

            print(f"\n{e.year} - {e.name}")
            print(f"  ID: {e.id}")
            print(f"  Date: {e.election_date}")
            print(f"  Total Candidates: {result_count}")
            print(f"  Winners: {winner_count}")

            # Party breakdown
            party_results = db.query(
                ElectionResult.party,
                func.count(ElectionResult.id).label('seats')
            ).filter(
                ElectionResult.election_id == e.id,
                ElectionResult.is_winner == 1
            ).group_by(ElectionResult.party).order_by(
                func.count(ElectionResult.id).desc()
            ).limit(5).all()

            print("  Top 5 parties:")
            for party, seats in party_results:
                print(f"    {party}: {seats} seats")

        print("\n" + "=" * 80)
        print("SUMMARY")
        print("=" * 80)
        total_elections = db.query(Election).count()
        total_results = db.query(ElectionResult).count()
        print(f"Total Elections: {total_elections}")
        print(f"Total Election Results: {total_results:,}")
        print("=" * 80)

    finally:
        db.close()


if __name__ == "__main__":
    verify_elections()
