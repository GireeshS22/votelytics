"""
Analyze party name inconsistencies across three elections
"""
import sys
sys.path.insert(0, '.')

from collections import defaultdict
from sqlalchemy import func
from app.database import SessionLocal
from app.models.election import Election, ElectionResult


def analyze_party_names():
    """Analyze party name variations and inconsistencies"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("PARTY NAME INCONSISTENCY ANALYSIS")
        print("=" * 80)

        # Get all three elections
        election_2011 = db.query(Election).filter(Election.year == 2011).first()
        election_2016 = db.query(Election).filter(Election.year == 2016).first()
        election_2021 = db.query(Election).filter(Election.year == 2021).first()

        # Get all unique party names per election
        print("\n" + "=" * 80)
        print("ALL UNIQUE PARTY NAMES PER ELECTION")
        print("=" * 80)

        for year, election in [(2011, election_2011), (2016, election_2016), (2021, election_2021)]:
            print(f"\n{year} Election:")
            parties = db.query(
                ElectionResult.party,
                func.count(ElectionResult.id).label('count')
            ).filter(
                ElectionResult.election_id == election.id
            ).group_by(
                ElectionResult.party
            ).order_by(
                func.count(ElectionResult.id).desc()
            ).all()

            print(f"  Total unique party names: {len(parties)}")
            for party, count in parties:
                print(f"    {party}: {count} results")

        # Find potential variations (case-insensitive grouping)
        print("\n" + "=" * 80)
        print("POTENTIAL PARTY NAME VARIATIONS")
        print("=" * 80)

        # Get all party names from all elections
        all_parties = db.query(
            ElectionResult.party,
            ElectionResult.year,
            func.count(ElectionResult.id).label('count')
        ).group_by(
            ElectionResult.party,
            ElectionResult.year
        ).order_by(
            ElectionResult.party
        ).all()

        # Group similar party names
        party_variations = defaultdict(lambda: defaultdict(int))
        for party, year, count in all_parties:
            # Normalize for comparison
            normalized = party.upper().strip()
            party_variations[normalized][party] = party_variations[normalized].get(party, 0) + count

        # Find parties with multiple variations
        print("\nParties with multiple name variations:")
        for normalized, variations in sorted(party_variations.items()):
            if len(variations) > 1:
                print(f"\n  {normalized}:")
                for variation, count in sorted(variations.items(), key=lambda x: x[1], reverse=True):
                    print(f"    '{variation}': {count} results")

        # Check ADMK vs AIADMK specifically
        print("\n" + "=" * 80)
        print("AIADMK / ADMK ANALYSIS")
        print("=" * 80)

        aiadmk_variations = ['AIADMK', 'ADMK', 'AIDMK', 'AIADMK(JJ)', 'ADMK(JJ)']

        for year, election in [(2011, election_2011), (2016, election_2016), (2021, election_2021)]:
            print(f"\n{year} Election:")
            for variation in aiadmk_variations:
                count = db.query(ElectionResult).filter(
                    ElectionResult.election_id == election.id,
                    ElectionResult.party == variation
                ).count()
                if count > 0:
                    print(f"  {variation}: {count} results")

        # Check winners specifically
        print("\n" + "=" * 80)
        print("WINNER PARTY NAMES (ADMK/AIADMK variations)")
        print("=" * 80)

        for year, election in [(2011, election_2011), (2016, election_2016), (2021, election_2021)]:
            print(f"\n{year} Election Winners:")
            for variation in aiadmk_variations:
                winners = db.query(ElectionResult).filter(
                    ElectionResult.election_id == election.id,
                    ElectionResult.party == variation,
                    ElectionResult.is_winner == 1
                ).all()

                if len(winners) > 0:
                    print(f"  {variation}: {len(winners)} winning constituencies")
                    # Show sample constituencies
                    for w in winners[:5]:
                        print(f"    - AC {w.ac_number} {w.ac_name}")
                    if len(winners) > 5:
                        print(f"    ... and {len(winners) - 5} more")

        # Check other common parties with potential variations
        print("\n" + "=" * 80)
        print("OTHER PARTY VARIATIONS TO CHECK")
        print("=" * 80)

        common_parties = ['DMK', 'INC', 'BJP', 'PMK', 'CPM', 'CPI', 'DMDK']

        for base_party in common_parties:
            print(f"\n{base_party} variations:")
            variations = db.query(
                ElectionResult.party,
                func.count(ElectionResult.id).label('count')
            ).filter(
                ElectionResult.party.like(f'%{base_party}%')
            ).group_by(
                ElectionResult.party
            ).all()

            if len(variations) > 1:
                for party, count in variations:
                    print(f"  {party}: {count} results")

        # Constituency-level inconsistency check
        print("\n" + "=" * 80)
        print("CONSTITUENCIES WHERE WINNING PARTY NAME CHANGED")
        print("(But might be same party with different spelling)")
        print("=" * 80)

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

        map_2011 = {w.constituency_id: w for w in winners_2011}
        map_2016 = {w.constituency_id: w for w in winners_2016}
        map_2021 = {w.constituency_id: w for w in winners_2021}

        common_const = set(map_2011.keys()) & set(map_2016.keys()) & set(map_2021.keys())

        print(f"\nChecking {len(common_const)} constituencies with data in all 3 elections...")

        # Focus on ADMK/AIADMK variations
        admk_inconsistencies = []
        for const_id in common_const:
            parties = [
                map_2011[const_id].party,
                map_2016[const_id].party,
                map_2021[const_id].party
            ]

            # Check if all parties contain 'ADMK' but with different spellings
            admk_variations_in_const = set()
            for p in parties:
                if 'ADMK' in p.upper() or 'AIDMK' in p.upper():
                    admk_variations_in_const.add(p)

            if len(admk_variations_in_const) > 1:
                admk_inconsistencies.append({
                    'constituency_id': const_id,
                    'constituency_name': map_2021[const_id].ac_name,
                    'ac_number': map_2021[const_id].ac_number,
                    '2011_party': map_2011[const_id].party,
                    '2016_party': map_2016[const_id].party,
                    '2021_party': map_2021[const_id].party,
                })

        if admk_inconsistencies:
            print(f"\nFound {len(admk_inconsistencies)} constituencies with ADMK/AIADMK spelling variations:")
            for const in admk_inconsistencies[:10]:
                print(f"\n  AC {const['ac_number']} - {const['constituency_name']}")
                print(f"    2011: {const['2011_party']}")
                print(f"    2016: {const['2016_party']}")
                print(f"    2021: {const['2021_party']}")

            if len(admk_inconsistencies) > 10:
                print(f"\n  ... and {len(admk_inconsistencies) - 10} more constituencies")

        print("\n" + "=" * 80)
        print("ANALYSIS COMPLETE")
        print("=" * 80)
        print("\nRecommendation: Standardize party names to ensure consistency")
        print("Suggested standardization:")
        print("  - ADMK, AIDMK, AIADMK(JJ), ADMK(JJ) → AIADMK")
        print("  - Apply similar standardization for other party variations")

    finally:
        db.close()


if __name__ == "__main__":
    analyze_party_names()
