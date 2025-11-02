"""
Verify 2016 election data quality
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import Election, ElectionResult

db = SessionLocal()

try:
    print("=" * 80)
    print("2016 DATA VERIFICATION")
    print("=" * 80)

    # Get sample winner
    print("\nSample Winner (Rank 1):")
    winner = db.query(ElectionResult).filter(
        ElectionResult.year == 2016,
        ElectionResult.is_winner == 1
    ).first()

    if winner:
        print(f"  Constituency: {winner.ac_name} (AC {winner.ac_number})")
        print(f"  Candidate: {winner.candidate_name}")
        print(f"  Party: {winner.party}")
        print(f"  Votes: {winner.total_votes:,} ({winner.vote_share_pct:.1f}%)")
        print(f"  Margin: {winner.margin:,} votes" if winner.margin else "  Margin: N/A")
        print(f"  Rank: {winner.rank}")

    # Get runner-up from same constituency
    print("\nRunner-up (Rank 2) from same constituency:")
    runner_up = db.query(ElectionResult).filter(
        ElectionResult.year == 2016,
        ElectionResult.ac_number == winner.ac_number,
        ElectionResult.rank == 2
    ).first()

    if runner_up:
        print(f"  Candidate: {runner_up.candidate_name}")
        print(f"  Party: {runner_up.party}")
        print(f"  Votes: {runner_up.total_votes:,}")
        print(f"  Margin: {runner_up.margin:,} votes" if runner_up.margin else "  Margin: N/A")
        print(f"  Rank: {runner_up.rank}")

    # Party-wise winners
    print("\n2016 Party-wise Winners:")
    from sqlalchemy import func
    party_counts = db.query(
        ElectionResult.party,
        func.count(ElectionResult.id).label('seats')
    ).filter(
        ElectionResult.year == 2016,
        ElectionResult.is_winner == 1
    ).group_by(ElectionResult.party).order_by(func.count(ElectionResult.id).desc()).limit(10).all()

    for party, seats in party_counts:
        print(f"  {party}: {seats} seats")

    # Verify both years exist
    print("\nBoth Years Data:")
    for year in [2016, 2021]:
        count = db.query(ElectionResult).filter(ElectionResult.year == year).count()
        winners = db.query(ElectionResult).filter(
            ElectionResult.year == year,
            ElectionResult.is_winner == 1
        ).count()
        print(f"  {year}: {count} candidates, {winners} winners")

    print("\n" + "=" * 80)
    print("[SUCCESS] 2016 data verification complete!")
    print("=" * 80)

finally:
    db.close()
