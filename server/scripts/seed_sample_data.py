"""Seed database with sample constituency and election data"""
import sys
from pathlib import Path
from datetime import date

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.election import Election, ElectionResult


def seed_sample_data():
    """Add sample constituencies and election data"""
    db = SessionLocal()

    try:
        print("Seeding sample data...")

        # Check if data already exists
        existing_constituencies = db.query(Constituency).count()
        if existing_constituencies > 0:
            print(f"[INFO] Database already has {existing_constituencies} constituencies")
            print("Skipping seed to avoid duplicates")
            return

        # Create sample constituencies
        constituencies = [
            Constituency(
                name="Chennai Central",
                code="TN001",
                district="Chennai",
                region="North",
                population=250000,
                urban_population_pct=95.0,
                literacy_rate=85.5,
            ),
            Constituency(
                name="Madurai Central",
                code="TN134",
                district="Madurai",
                region="South",
                population=180000,
                urban_population_pct=75.0,
                literacy_rate=78.2,
            ),
            Constituency(
                name="Coimbatore North",
                code="TN098",
                district="Coimbatore",
                region="West",
                population=220000,
                urban_population_pct=82.0,
                literacy_rate=82.5,
            ),
        ]

        for const in constituencies:
            db.add(const)

        db.commit()
        print(f"[SUCCESS] Added {len(constituencies)} sample constituencies")

        # Create sample election
        election_2021 = Election(
            year=2021,
            name="Tamil Nadu Legislative Assembly Election 2021",
            election_type="Assembly",
            state="Tamil Nadu",
            election_date=date(2021, 4, 6),
            total_seats=234,
            total_voters=62800000,
            voter_turnout_pct=71.8,
        )

        db.add(election_2021)
        db.commit()
        db.refresh(election_2021)
        print(f"[SUCCESS] Added 2021 election")

        # Create sample election results
        results = [
            # Chennai Central
            ElectionResult(
                election_id=election_2021.id,
                constituency_id=1,
                candidate_name="A. Raja",
                party="DMK",
                alliance="DMK Alliance",
                votes_received=95000,
                vote_share_pct=52.5,
                total_votes_polled=180000,
                total_valid_votes=175000,
                is_winner=1,
                margin=15000,
                margin_pct=8.5,
            ),
            ElectionResult(
                election_id=election_2021.id,
                constituency_id=1,
                candidate_name="B. Kumar",
                party="AIADMK",
                alliance="AIADMK Alliance",
                votes_received=80000,
                vote_share_pct=44.0,
                total_votes_polled=180000,
                total_valid_votes=175000,
                is_winner=0,
            ),
            # Madurai Central
            ElectionResult(
                election_id=election_2021.id,
                constituency_id=2,
                candidate_name="S. Meenakshi",
                party="DMK",
                alliance="DMK Alliance",
                votes_received=85000,
                vote_share_pct=51.2,
                total_votes_polled=165000,
                total_valid_votes=160000,
                is_winner=1,
                margin=12000,
                margin_pct=7.5,
            ),
            ElectionResult(
                election_id=election_2021.id,
                constituency_id=2,
                candidate_name="P. Selvam",
                party="AIADMK",
                alliance="AIADMK Alliance",
                votes_received=73000,
                vote_share_pct=43.7,
                total_votes_polled=165000,
                total_valid_votes=160000,
                is_winner=0,
            ),
            # Coimbatore North
            ElectionResult(
                election_id=election_2021.id,
                constituency_id=3,
                candidate_name="K. Rajesh",
                party="BJP",
                alliance="AIADMK Alliance",
                votes_received=92000,
                vote_share_pct=49.5,
                total_votes_polled=185000,
                total_valid_votes=180000,
                is_winner=1,
                margin=8000,
                margin_pct=4.4,
            ),
            ElectionResult(
                election_id=election_2021.id,
                constituency_id=3,
                candidate_name="M. Anand",
                party="DMK",
                alliance="DMK Alliance",
                votes_received=84000,
                vote_share_pct=45.1,
                total_votes_polled=185000,
                total_valid_votes=180000,
                is_winner=0,
            ),
        ]

        for result in results:
            db.add(result)

        db.commit()
        print(f"[SUCCESS] Added {len(results)} sample election results")

        print("\n[SUCCESS] Sample data seeded successfully!")
        print("\nYou can now test the API at:")
        print("  - http://localhost:8000/api/docs")
        print("  - http://localhost:8000/api/constituencies")
        print("  - http://localhost:8000/api/elections")

    except Exception as e:
        print(f"[ERROR] Failed to seed data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_sample_data()
