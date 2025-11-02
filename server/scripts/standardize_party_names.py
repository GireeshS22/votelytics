"""
Standardize party names across all elections for consistency
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.election import ElectionResult


# Define party name standardization mapping
PARTY_NAME_MAPPING = {
    # AIADMK variations
    'ADMK': 'AIADMK',
    'AIDMK': 'AIADMK',
    'AIADMK(JJ)': 'AIADMK',
    'ADMK(JJ)': 'AIADMK',

    # CPM variations
    'CPI(M)': 'CPM',
    'CPIM': 'CPM',

    # Case variations
    'MKat': 'MKAT',
    'mauk': 'MAUK',
    'tmc': 'TMC',
}


def standardize_party_names():
    """Standardize party names in election_results table"""
    db = SessionLocal()

    try:
        print("=" * 80)
        print("STANDARDIZING PARTY NAMES")
        print("=" * 80)

        total_updated = 0

        for old_name, new_name in PARTY_NAME_MAPPING.items():
            # Count records to be updated
            count = db.query(ElectionResult).filter(
                ElectionResult.party == old_name
            ).count()

            if count > 0:
                print(f"\nStandardizing '{old_name}' -> '{new_name}'")
                print(f"  Found {count} records to update")

                # Update the records
                db.query(ElectionResult).filter(
                    ElectionResult.party == old_name
                ).update(
                    {ElectionResult.party: new_name},
                    synchronize_session=False
                )

                total_updated += count
                print(f"  Updated {count} records")

        # Commit all changes
        db.commit()

        print(f"\n{'=' * 80}")
        print(f"STANDARDIZATION COMPLETE")
        print(f"{'=' * 80}")
        print(f"\nTotal records updated: {total_updated}")

        # Verify the changes
        print(f"\n{'=' * 80}")
        print("VERIFICATION - AIADMK/ADMK after standardization")
        print(f"{'=' * 80}")

        for election_year in [2011, 2016, 2021]:
            aiadmk_count = db.query(ElectionResult).filter(
                ElectionResult.year == election_year,
                ElectionResult.party == 'AIADMK'
            ).count()

            aiadmk_winners = db.query(ElectionResult).filter(
                ElectionResult.year == election_year,
                ElectionResult.party == 'AIADMK',
                ElectionResult.is_winner == 1
            ).count()

            admk_count = db.query(ElectionResult).filter(
                ElectionResult.year == election_year,
                ElectionResult.party == 'ADMK'
            ).count()

            print(f"\n{election_year}:")
            print(f"  AIADMK: {aiadmk_count} total results, {aiadmk_winners} winners")
            print(f"  ADMK: {admk_count} total results (should be 0)")

    except Exception as e:
        print(f"\n[ERROR] Failed to standardize: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\nThis script will update party names in the database.")
    print("Mappings to be applied:")
    for old, new in PARTY_NAME_MAPPING.items():
        print(f"  {old} -> {new}")

    response = input("\nProceed with standardization? (yes/no): ")

    if response.lower() in ['yes', 'y']:
        standardize_party_names()
        print("\n[SUCCESS] Party names standardized successfully!")
    else:
        print("\n[CANCELLED] No changes made.")
