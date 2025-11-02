"""
Load 2011 Tamil Nadu Assembly Election data into database
"""
import sys
import re
from datetime import datetime, date
sys.path.insert(0, '.')

import pandas as pd
from sqlalchemy import func
from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.election import Election, ElectionResult


def clean_candidate_name(name):
    """Remove rank prefix from candidate name (e.g., '1 GOVINDARAJAN T.J' -> 'GOVINDARAJAN T.J')"""
    # Remove leading digits and spaces
    cleaned = re.sub(r'^\d+\s+', '', str(name))
    return cleaned.strip()


def load_2011_data():
    """Load complete 2011 election data from parsed CSV"""

    print("=" * 80)
    print("LOADING 2011 TAMIL NADU ASSEMBLY ELECTION DATA")
    print("=" * 80)

    # Read parsed CSV file
    print("\n[1/4] Reading parsed CSV file...")
    df = pd.read_csv('data/2011_parsed_data.csv')
    print(f"  Loaded {len(df)} rows from CSV")
    print(f"  Constituencies: {df['AC NO.'].nunique()}")
    print(f"  Candidates: {len(df)}")

    # Initialize database session
    db = SessionLocal()

    try:
        # Step 1: Check if constituencies already exist (they should from 2021/2016 data)
        print("\n[2/4] Checking existing constituencies...")
        existing_constituencies = db.query(Constituency).all()
        constituency_map = {c.ac_number: c.id for c in existing_constituencies}
        print(f"  Found {len(constituency_map)} existing constituencies")

        # If constituencies don't exist, create them
        if len(constituency_map) == 0:
            print("  Creating constituencies...")
            constituencies_df = df.groupby(['AC NO.', 'AC NAME']).agg({
                'TOTAL ELECTORS': 'first'
            }).reset_index()

            for _, row in constituencies_df.iterrows():
                constituency = Constituency(
                    ac_number=int(row['AC NO.']),
                    name=row['AC NAME'],
                    code=f"TN{int(row['AC NO.']):03d}",
                    district="Unknown",
                    region="Unknown",
                    population=None,
                    urban_population_pct=None,
                    literacy_rate=None
                )
                db.add(constituency)
                db.flush()
                constituency_map[int(row['AC NO.'])] = constituency.id

            db.commit()
            print(f"  Created {len(constituency_map)} constituencies")

        # Step 2: Create 2011 election record
        print("\n[3/4] Creating 2011 election record...")

        # Check if 2011 election already exists
        existing_election = db.query(Election).filter(Election.year == 2011).first()
        if existing_election:
            print(f"  [WARNING] 2011 election already exists (ID: {existing_election.id})")
            print(f"  Please delete it first if you want to reload the data")
            return

        election = Election(
            year=2011,
            name="Tamil Nadu Legislative Assembly Election 2011",
            election_type="Assembly",
            state="Tamil Nadu",
            election_date=date(2011, 5, 13),  # Election date: May 13, 2011
            total_seats=234,
            total_voters=None,  # Will calculate from data
            voter_turnout_pct=None  # Will calculate from data
        )
        db.add(election)
        db.commit()
        print(f"  Created election record (ID: {election.id})")

        # Step 3: Process election results in batches
        print("\n[4/4] Processing election results...")
        print(f"  Total candidates: {len(df)}")

        results_to_insert = []
        batch_size = 500

        # Group by constituency to calculate ranks and margins
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
                    year=2011,
                    ac_number=int(row['AC NO.']),
                    ac_name=row['AC NAME'],
                    total_electors=int(row['TOTAL ELECTORS']),

                    # Candidate details
                    candidate_name=row['CANDIDATE NAME'],
                    sex=row['SEX'] if pd.notna(row['SEX']) else None,
                    age=int(row['AGE']) if pd.notna(row['AGE']) else None,
                    category=row['CATEGORY'] if pd.notna(row['CATEGORY']) else None,

                    # Party details
                    party=row['PARTY'],
                    symbol=None,  # Not available in PDF
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

                # Batch insert every batch_size records
                if len(results_to_insert) >= batch_size:
                    print(f"  Inserting batch of {len(results_to_insert)} records...")
                    db.bulk_save_objects(results_to_insert)
                    db.commit()
                    results_to_insert = []

        # Insert remaining results
        if results_to_insert:
            print(f"  Inserting final batch of {len(results_to_insert)} records...")
            db.bulk_save_objects(results_to_insert)
            db.commit()

        print(f"  [SUCCESS] All election results inserted")

        # Step 4: Verify data
        print("\n" + "=" * 80)
        print("VERIFYING DATA")
        print("=" * 80)

        constituency_count = db.query(Constituency).count()
        election_count = db.query(Election).filter(Election.year == 2011).count()
        result_count = db.query(ElectionResult).filter(ElectionResult.year == 2011).count()
        winner_count = db.query(ElectionResult).filter(
            ElectionResult.year == 2011,
            ElectionResult.is_winner == 1
        ).count()

        print(f"  Constituencies in DB: {constituency_count}")
        print(f"  2011 Elections: {election_count}")
        print(f"  2011 Election Results: {result_count}")
        print(f"  2011 Winners: {winner_count}")

        # Show some sample data
        print("\n  Sample winners:")
        sample_winners = db.query(ElectionResult).filter(
            ElectionResult.year == 2011,
            ElectionResult.is_winner == 1
        ).limit(5).all()

        for winner in sample_winners:
            print(f"    AC {winner.ac_number} - {winner.ac_name}: {winner.candidate_name} ({winner.party}) - {winner.total_votes:,} votes")

        # Party-wise breakdown
        print("\n  Party-wise seat distribution:")
        party_results = db.query(
            ElectionResult.party,
            func.count(ElectionResult.id).label('seats')
        ).filter(
            ElectionResult.year == 2011,
            ElectionResult.is_winner == 1
        ).group_by(ElectionResult.party).order_by(func.count(ElectionResult.id).desc()).limit(10).all()

        for party, seats in party_results:
            print(f"    {party}: {seats} seats")

        print("\n" + "=" * 80)
        print("[SUCCESS] 2011 election data loaded successfully!")
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
    load_2011_data()
