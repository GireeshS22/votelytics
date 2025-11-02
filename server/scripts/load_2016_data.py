"""
Load 2016 Tamil Nadu Assembly Election data from Excel file
APPEND mode - does not overwrite existing data
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
    """Remove rank prefix from candidate name"""
    cleaned = re.sub(r'^\d+\s+', '', str(name))
    return cleaned.strip()


def load_2016_data():
    """Load complete 2016 election data (APPEND mode)"""

    print("=" * 80)
    print("LOADING 2016 TAMIL NADU ASSEMBLY ELECTION DATA (APPEND MODE)")
    print("=" * 80)

    # Read Excel file
    print("\n[1/5] Reading Excel file...")
    df = pd.read_excel('data/2016 Detailed Results.xlsx')

    # Strip leading/trailing spaces from column names
    df.columns = df.columns.str.strip()

    print(f"  Loaded {len(df)} rows")
    print(f"  Columns: {list(df.columns)}")

    # Initialize database session
    db = SessionLocal()

    try:
        # Step 1: Check if 2016 election already exists
        print("\n[2/5] Checking existing data...")
        existing_election = db.query(Election).filter(Election.year == 2016).first()
        if existing_election:
            print(f"  WARNING: 2016 election already exists (ID: {existing_election.id})")
            print(f"  Skipping load. Delete existing 2016 data first if you want to reload.")
            return

        # Get existing constituencies from database
        constituencies = db.query(Constituency).all()
        constituency_map = {c.ac_number: c.id for c in constituencies}
        print(f"  Found {len(constituency_map)} existing constituencies")

        # Step 2: Create 2016 election record
        print("\n[3/5] Creating 2016 election record...")
        election = Election(
            year=2016,
            name="Tamil Nadu Legislative Assembly Election 2016",
            election_type="Assembly",
            state="Tamil Nadu",
            election_date=date(2016, 5, 16),
            total_seats=234,
            total_voters=None,
            voter_turnout_pct=None
        )
        db.add(election)
        db.commit()
        print(f"  Created election record (ID: {election.id})")

        # Step 3: Process election results
        print("\n[4/5] Processing election results...")
        print(f"  Total candidates: {len(df)}")

        # Replace NaN values with 0 for vote columns
        vote_columns = ['VALID VOTES POLLED in General', 'VALID VOTES POLLED in Postal', 'Total Valid Votes', 'Total Electors']
        for col in vote_columns:
            df[col] = df[col].fillna(0)

        # Group by constituency to calculate ranks and margins
        results_to_insert = []
        skipped_constituencies = []

        for ac_no, group in df.groupby('Constituency No.'):
            # Check if constituency exists
            if ac_no not in constituency_map:
                skipped_constituencies.append(ac_no)
                continue

            # Sort by votes (descending) to calculate ranks
            group_sorted = group.sort_values('Total Valid Votes', ascending=False).reset_index(drop=True)

            # Get winner and runner-up for margin calculation
            winner_votes = group_sorted.iloc[0]['Total Valid Votes'] if len(group_sorted) > 0 else 0
            runner_up_votes = group_sorted.iloc[1]['Total Valid Votes'] if len(group_sorted) > 1 else 0
            margin = winner_votes - runner_up_votes

            # Skip constituencies where election was countermanded (all votes are 0)
            if winner_votes == 0:
                print(f"  Skipping constituency {ac_no} - countermanded election (0 votes)")
                continue

            for idx, row in group_sorted.iterrows():
                rank = idx + 1
                is_winner = 1 if rank == 1 else 0

                # Calculate margin (only for winner and runner-up)
                result_margin = int(margin) if rank in [1, 2] else None

                # Calculate vote share percentage
                total_electors = row['Total Electors'] if row['Total Electors'] > 0 else 1
                vote_share_pct = float((row['Total Valid Votes'] / total_electors) * 100) if total_electors > 0 else 0

                result_margin_pct = float(result_margin / total_electors * 100) if result_margin and total_electors > 0 else None

                result = ElectionResult(
                    election_id=election.id,
                    constituency_id=constituency_map[int(ac_no)],
                    candidate_id=None,

                    # Denormalized fields
                    year=2016,
                    ac_number=int(row['Constituency No.']),
                    ac_name=row['Constituency Name'],
                    total_electors=int(row['Total Electors']),

                    # Candidate details
                    candidate_name=clean_candidate_name(row['Candidate Name']),
                    sex=row['Candidate Sex'] if pd.notna(row['Candidate Sex']) else None,
                    age=int(row['Candidate Age']) if pd.notna(row['Candidate Age']) else None,
                    category=row['Candidate Category'] if pd.notna(row['Candidate Category']) else None,

                    # Party details
                    party=row['Party Name'].strip() if pd.notna(row['Party Name']) else 'Unknown',
                    symbol=None,  # Not available in 2016 data
                    alliance=None,

                    # Vote counts
                    general_votes=int(row['VALID VOTES POLLED in General']),
                    postal_votes=int(row['VALID VOTES POLLED in Postal']),
                    total_votes=int(row['Total Valid Votes']),
                    vote_share_pct=vote_share_pct,

                    # Result metadata
                    rank=rank,
                    is_winner=is_winner,
                    margin=result_margin,
                    margin_pct=result_margin_pct
                )
                results_to_insert.append(result)

        if skipped_constituencies:
            print(f"  WARNING: Skipped {len(skipped_constituencies)} constituencies not in database")

        # Bulk insert all results in batches to avoid connection timeout
        print(f"  Inserting {len(results_to_insert)} election results...")
        BATCH_SIZE = 500
        total_batches = (len(results_to_insert) + BATCH_SIZE - 1) // BATCH_SIZE

        for i in range(0, len(results_to_insert), BATCH_SIZE):
            batch = results_to_insert[i:i + BATCH_SIZE]
            db.bulk_save_objects(batch)
            db.commit()
            batch_num = i // BATCH_SIZE + 1
            print(f"    Batch {batch_num}/{total_batches} inserted ({len(batch)} records)")

        print(f"  [OK] Inserted {len(results_to_insert)} election results")

        # Step 4: Verify data
        print("\n[5/5] Verifying data...")
        election_count = db.query(Election).count()
        result_count = db.query(ElectionResult).count()
        result_2016_count = db.query(ElectionResult).filter(ElectionResult.year == 2016).count()
        winner_2016_count = db.query(ElectionResult).filter(
            ElectionResult.year == 2016,
            ElectionResult.is_winner == 1
        ).count()

        print(f"  Total Elections: {election_count}")
        print(f"  Total Election Results: {result_count}")
        print(f"  2016 Results: {result_2016_count}")
        print(f"  2016 Winners: {winner_2016_count}")

        print("\n" + "=" * 80)
        print("[SUCCESS] 2016 election data loaded successfully!")
        print("[INFO] Data APPENDED - existing records preserved")
        print("=" * 80)

    except Exception as e:
        print(f"\n[ERROR] Failed to load data: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    load_2016_data()
