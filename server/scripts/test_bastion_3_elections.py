"""
Test the 3-election bastion seats analysis
"""
import sys
sys.path.insert(0, '.')

from collections import defaultdict
from app.database import SessionLocal
from app.models.election import Election, ElectionResult


def test_bastion_analysis():
    """Test bastion seats analysis for 3 elections"""
    db = SessionLocal()

    try:
        # Get all three elections
        election_2011 = db.query(Election).filter(Election.year == 2011).first()
        election_2016 = db.query(Election).filter(Election.year == 2016).first()
        election_2021 = db.query(Election).filter(Election.year == 2021).first()

        print("=" * 80)
        print("3-ELECTION BASTION SEATS ANALYSIS TEST")
        print("=" * 80)

        # Get winners from all three elections
        winners_2011 = db.query(ElectionResult).filter(
            ElectionResult.election_id == election_2011.id,
            ElectionResult.is_winner == 1
        ).all()

        winners_2016 = db.query(ElectionResult).filter(
            ElectionResult.election_id == election_2016.id,
            ElectionResult.is_winner == 1
        ).all()

        winners_2021 = db.query(ElectionResult).filter(
            ElectionResult.election_id == election_2021.id,
            ElectionResult.is_winner == 1
        ).all()

        print(f"\nWinners per election:")
        print(f"  2011: {len(winners_2011)} winners")
        print(f"  2016: {len(winners_2016)} winners")
        print(f"  2021: {len(winners_2021)} winners")

        # Create mappings
        map_2011 = {w.constituency_id: w for w in winners_2011}
        map_2016 = {w.constituency_id: w for w in winners_2016}
        map_2021 = {w.constituency_id: w for w in winners_2021}

        # Find common constituencies
        common_constituencies = set(map_2011.keys()) & set(map_2016.keys()) & set(map_2021.keys())
        print(f"\nConstituencies with data in all 3 elections: {len(common_constituencies)}")

        # Find bastion seats (same party all 3 elections)
        bastion_seats = []
        party_bastions = defaultdict(lambda: {'count': 0, 'seats': []})

        for const_id in common_constituencies:
            winner_2011 = map_2011[const_id]
            winner_2016 = map_2016[const_id]
            winner_2021 = map_2021[const_id]

            # Check if same party won all three times
            if winner_2011.party == winner_2016.party == winner_2021.party:
                avg_margin = (
                    (winner_2011.margin or 0) +
                    (winner_2016.margin or 0) +
                    (winner_2021.margin or 0)
                ) / 3

                bastion_data = {
                    'constituency_name': winner_2021.ac_name,
                    'ac_number': winner_2021.ac_number,
                    'party': winner_2021.party,
                    'margin_2011': winner_2011.margin,
                    'margin_2016': winner_2016.margin,
                    'margin_2021': winner_2021.margin,
                    'avg_margin': int(avg_margin),
                }

                bastion_seats.append(bastion_data)
                party_bastions[winner_2021.party]['count'] += 1
                party_bastions[winner_2021.party]['seats'].append(bastion_data)

        # Sort by average margin
        bastion_seats.sort(key=lambda x: x['avg_margin'], reverse=True)

        print(f"\n{'=' * 80}")
        print(f"RESULTS")
        print(f"{'=' * 80}")
        print(f"\nTotal Bastion Seats (same party won all 3 elections): {len(bastion_seats)}")
        print(f"Percentage of constituencies: {(len(bastion_seats) / len(common_constituencies)) * 100:.2f}%")

        # Party-wise breakdown
        print(f"\n{'=' * 80}")
        print(f"PARTY-WISE BASTION SEATS")
        print(f"{'=' * 80}")

        party_list = sorted(party_bastions.items(), key=lambda x: x[1]['count'], reverse=True)
        for party, data in party_list:
            avg_party_margin = sum(s['avg_margin'] for s in data['seats']) / data['count']
            print(f"\n{party}: {data['count']} bastions (avg margin: {int(avg_party_margin):,})")

        # Show top 10 strongest bastions
        print(f"\n{'=' * 80}")
        print(f"TOP 10 STRONGEST BASTIONS (by average margin)")
        print(f"{'=' * 80}")

        for i, seat in enumerate(bastion_seats[:10], 1):
            print(f"\n{i}. AC {seat['ac_number']} - {seat['constituency_name']}")
            print(f"   Party: {seat['party']}")
            print(f"   Margins: 2011={seat['margin_2011']:,}, 2016={seat['margin_2016']:,}, 2021={seat['margin_2021']:,}")
            print(f"   Average Margin: {seat['avg_margin']:,}")

    finally:
        db.close()


if __name__ == "__main__":
    test_bastion_analysis()
