"""
Load 2021 Tamil Nadu Assembly Election data from Excel file
"""
import sys
import re
from datetime import datetime, date
sys.path.insert(0, '.')

import pandas as pd
from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.election import Election, ElectionResult


def clean_candidate_name(name):
    """Remove rank prefix from candidate name (e.g., '1 GOVINDARAJAN T.J' -> 'GOVINDARAJAN T.J')"""
    # Remove leading digits and spaces
    cleaned = re.sub(r'^\d+\s+', '', str(name))
    return cleaned.strip()


def load_2021_data():
    """Load complete 2021 election data"""

    print("=" * 80)
    print("LOADING 2021 TAMIL NADU ASSEMBLY ELECTION DATA")
    print("=" * 80)

    # Read Excel file
    print("\n[1/5] Reading Excel file...")
    df = pd.read_excel('data/10- Detailed Results_2021.xlsx')
    print(f"  Loaded {len(df)} rows")

    # Initialize database session
    db = SessionLocal()

    try:
        # Step 1: Create constituencies
        print("\n[2/5] Creating constituencies...")
        constituencies_df = df.groupby(['AC NO.', 'AC NAME']).agg({
            'TOTAL ELECTORS': 'first'
        }).reset_index()

        constituency_map = {}  # Map AC NO. to constituency_id

        for _, row in constituencies_df.iterrows():
            constituency = Constituency(
                ac_number=int(row['AC NO.']),
                name=row['AC NAME'],
                code=f"TN{int(row['AC NO.']):03d}",  # TN001, TN002, etc.
                district="Unknown",  # Will be updated later
                region="Unknown",  # Will be updated later
                population=None,
                urban_population_pct=None,
                literacy_rate=None
            )
            db.add(constituency)
            db.flush()  # Get the ID
            constituency_map[int(row['AC NO.'])] = constituency.id

        db.commit()
        print(f"  Created {len(constituency_map)} constituencies")

        # Step 2: Create 2021 election record
        print("\n[3/5] Creating 2021 election record...")
        election = Election(
            year=2021,
            name="Tamil Nadu Legislative Assembly Election 2021",
            election_type="Assembly",
            state="Tamil Nadu",
            election_date=date(2021, 4, 6),
            total_seats=234,
            total_voters=None,  # Will calculate from data
            voter_turnout_pct=None  # Will calculate from data
        )
        db.add(election)
        db.commit()
        print(f"  Created election record (ID: {election.id})")

        # Step 3: Process election results
        print("\n[4/5] Processing election results...")
        print(f"  Total candidates: {len(df)}")

        # Group by constituency to calculate ranks and margins
        results_to_insert = []

        for ac_no, group in df.groupby('AC NO.'):
            # Sort by votes (descending) to calculate ranks
            group_sorted = group.sort_values('TOTAL', ascending=False).reset_index(drop=True)

            # Get winner and runner-up for margin calculation
            winner_votes = group_sorted.iloc[0]['TOTAL'] if len(group_sorted) > 0 else 0
            runner_up_votes = group_sorted.iloc[1]['TOTAL'] if len(group_sorted) > 1 else 0
            margin = winner_votes - runner_up_votes

            for idx, row in group_sorted.iterrows():
                rank = idx + 1
                is_winner = 1 if rank == 1 else 0

                # Calculate margin (only for winner and runner-up)
                result_margin = int(margin) if rank in [1, 2] else None
                result_margin_pct = float(result_margin / row['TOTAL ELECTORS'] * 100) if result_margin and row['TOTAL ELECTORS'] > 0 else None

                result = ElectionResult(
                    election_id=election.id,
                    constituency_id=constituency_map[int(ac_no)],
                    candidate_id=None,  # We're not creating candidate records yet

                    # Denormalized fields
                    year=2021,
                    ac_number=int(row['AC NO.']),
                    ac_name=row['AC NAME'],
                    total_electors=int(row['TOTAL ELECTORS']),

                    # Candidate details
                    candidate_name=clean_candidate_name(row['CANDIDATE NAME']),
                    sex=row['SEX'] if pd.notna(row['SEX']) else None,
                    age=int(row['AGE']) if pd.notna(row['AGE']) else None,
                    category=row['CATEGORY'] if pd.notna(row['CATEGORY']) else None,

                    # Party details
                    party=row['PARTY'],
                    symbol=row['SYMBOL'],
                    alliance=None,  # Will be updated later

                    # Vote counts
                    general_votes=int(row['GENERAL']),
                    postal_votes=int(row['POSTAL']),
                    total_votes=int(row['TOTAL']),
                    vote_share_pct=float(row['% VOTES POLLED']),

                    # Result metadata
                    rank=rank,
                    is_winner=is_winner,
                    margin=result_margin,
                    margin_pct=result_margin_pct
                )
                results_to_insert.append(result)

        # Bulk insert all results
        print(f"  Inserting {len(results_to_insert)} election results...")
        db.bulk_save_objects(results_to_insert)
        db.commit()
        print(f"  Inserted {len(results_to_insert)} election results")

        # Step 4: Verify data
        print("\n[5/5] Verifying data...")
        constituency_count = db.query(Constituency).count()
        election_count = db.query(Election).count()
        result_count = db.query(ElectionResult).count()
        winner_count = db.query(ElectionResult).filter(ElectionResult.is_winner == 1).count()

        print(f"  Constituencies: {constituency_count}")
        print(f"  Elections: {election_count}")
        print(f"  Election Results: {result_count}")
        print(f"  Winners: {winner_count}")

        print("\n" + "=" * 80)
        print("[SUCCESS] 2021 election data loaded successfully!")
        print("=" * 80)

    except Exception as e:
        print(f"\n[ERROR] Failed to load data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    load_2021_data()
