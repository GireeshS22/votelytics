"""
Script to populate constituency demographics using LLM
Fetches population, urban %, and literacy rate for all 234 Tamil Nadu constituencies
"""
import sys
import os
import time
import json
import argparse
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.constituency import Constituency
from app.config import settings
from app.services.demographics_fetcher import fetch_demographics_from_llm


def get_constituencies_needing_demographics(db: Session, constituency_ids=None):
    """Get constituencies that need demographics populated"""
    query = db.query(Constituency)

    if constituency_ids:
        # Specific constituencies
        query = query.filter(Constituency.id.in_(constituency_ids))
    else:
        # All constituencies missing any demographic field
        query = query.filter(
            (Constituency.population == None) |
            (Constituency.urban_population_pct == None) |
            (Constituency.literacy_rate == None)
        )

    return query.order_by(Constituency.ac_number).all()


def update_constituency_demographics(
    db: Session,
    constituency_id: int,
    population: int,
    urban_pct: float,
    literacy_rate: float
):
    """Update constituency with demographics data"""
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()
    if constituency:
        constituency.population = population
        constituency.urban_population_pct = urban_pct
        constituency.literacy_rate = literacy_rate
        db.commit()
        return True
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Populate constituency demographics using LLM"
    )
    parser.add_argument(
        "--model",
        default="gpt-5-mini",
        help="OpenAI model to use (default: gpt-5-mini)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Test without saving to database"
    )
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        default=True,
        help="Skip constituencies that already have demographics (default: True)"
    )
    parser.add_argument(
        "--constituency-ids",
        type=str,
        help="Comma-separated constituency IDs to process (e.g., 1,2,3)"
    )
    parser.add_argument(
        "--delay",
        type=int,
        default=2,
        help="Delay in seconds between API calls (default: 2)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Number of calls before pause (default: 10)"
    )

    args = parser.parse_args()

    # Validate API key
    if not settings.OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not found in environment!")
        print("Please add OPENAI_API_KEY=sk-... to your .env file")
        sys.exit(1)

    # Parse constituency IDs if provided
    constituency_ids = None
    if args.constituency_ids:
        try:
            constituency_ids = [int(x.strip()) for x in args.constituency_ids.split(",")]
        except ValueError:
            print("ERROR: Invalid constituency IDs format. Use comma-separated integers.")
            sys.exit(1)

    print("=" * 80)
    print("CONSTITUENCY DEMOGRAPHICS POPULATION SCRIPT")
    print("=" * 80)
    print(f"Model: {args.model}")
    print(f"Mode: {'DRY RUN (no database updates)' if args.dry_run else 'LIVE (will update database)'}")
    print(f"Skip existing: {args.skip_existing}")
    print(f"Delay between calls: {args.delay}s")
    print(f"Batch size: {args.batch_size}")
    print()

    # Get database session
    db = SessionLocal()

    try:
        # Get constituencies to process
        print("Checking database...")
        if args.skip_existing and not constituency_ids:
            constituencies = get_constituencies_needing_demographics(db)
        elif constituency_ids:
            constituencies = db.query(Constituency).filter(
                Constituency.id.in_(constituency_ids)
            ).order_by(Constituency.ac_number).all()
        else:
            # Process all
            constituencies = db.query(Constituency).order_by(Constituency.ac_number).all()

        total_count = len(constituencies)
        print(f"Found {total_count} constituencies to process")
        print()

        if total_count == 0:
            print("No constituencies to process. Exiting.")
            return

        # Confirm before proceeding
        if not args.dry_run:
            response = input(f"Proceed with updating {total_count} constituencies? (yes/no): ")
            if response.lower() != "yes":
                print("Aborted.")
                return

        print("Starting population process...")
        print()

        # Track stats
        successful = 0
        failed = 0
        skipped = 0
        failed_list = []
        start_time = datetime.now()

        # Process each constituency
        for idx, constituency in enumerate(constituencies, 1):
            print(f"[{idx}/{total_count}] {constituency.name} (AC #{constituency.ac_number})")
            print(f"    District: {constituency.district} | Region: {constituency.region}")

            # Check if already has data
            if args.skip_existing and constituency.population and constituency.urban_population_pct and constituency.literacy_rate:
                print(f"    ⊘ Skipped (already has data)")
                skipped += 1
                print()
                continue

            # Fetch demographics
            print(f"    → Fetching demographics...", end=" ", flush=True)

            demographics = fetch_demographics_from_llm(
                constituency_name=constituency.name,
                district=constituency.district,
                region=constituency.region or "Unknown",
                ac_number=constituency.ac_number,
                api_key=settings.OPENAI_API_KEY,
                model=args.model
            )

            if demographics:
                print("✓")
                print(f"    Pop: {demographics['population']:,} | Urban: {demographics['urban_pct']:.1f}% | Literacy: {demographics['literacy_rate']:.1f}%")

                # Save to database (unless dry run)
                if not args.dry_run:
                    success = update_constituency_demographics(
                        db=db,
                        constituency_id=constituency.id,
                        population=demographics['population'],
                        urban_pct=demographics['urban_pct'],
                        literacy_rate=demographics['literacy_rate']
                    )
                    if success:
                        print(f"    ✓ Saved to database")
                        successful += 1
                    else:
                        print(f"    ✗ Failed to save to database")
                        failed += 1
                        failed_list.append({
                            "id": constituency.id,
                            "name": constituency.name,
                            "reason": "Database update failed"
                        })
                else:
                    print(f"    ⊘ Dry run - not saved")
                    successful += 1

            else:
                print("✗ Failed")
                failed += 1
                failed_list.append({
                    "id": constituency.id,
                    "name": constituency.name,
                    "reason": "LLM fetch failed"
                })

            print()

            # Delay between calls
            if idx < total_count:
                time.sleep(args.delay)

            # Pause every batch_size calls
            if idx % args.batch_size == 0 and idx < total_count:
                print(f"--- Batch complete ({idx}/{total_count}). Pausing 2s for API cooldown ---")
                print()
                time.sleep(2)

        # Final summary
        end_time = datetime.now()
        duration = end_time - start_time

        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total processed: {total_count}")
        print(f"Successfully updated: {successful}")
        print(f"Failed: {failed}")
        print(f"Skipped: {skipped}")
        print(f"Time taken: {duration}")
        print()

        if failed_list:
            print("Failed constituencies:")
            for item in failed_list:
                print(f"  - {item['name']} (ID: {item['id']}): {item['reason']}")
            print()

            # Save failed list to file
            failed_file = "failed_demographics.json"
            with open(failed_file, "w") as f:
                json.dump(failed_list, f, indent=2)
            print(f"Failed constituencies saved to: {failed_file}")
            print()

            # Show retry command
            failed_ids = [str(item['id']) for item in failed_list]
            print("To retry failures, run:")
            print(f"poetry run python scripts/populate_demographics.py --constituency-ids {','.join(failed_ids)}")
            print()

        # Estimate cost (rough)
        if not args.dry_run and successful > 0:
            estimated_cost = successful * 0.0003  # Very rough estimate for gpt-5-mini
            print(f"Estimated API cost: ${estimated_cost:.2f}")
            print()

        print("Done!")

    finally:
        db.close()


if __name__ == "__main__":
    main()
