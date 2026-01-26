"""
Script to generate 2026 election predictions for all Tamil Nadu constituencies
Uses ChatGPT to analyze historical data and current trends
"""
import sys
import os
import time
import json
import argparse
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.prediction import Prediction
from app.config import settings
from app.services.prediction_generator import (
    load_alliance_config,
    load_trends_summary,
    generate_prediction_for_constituency
)


def get_current_version(db: Session, year: int) -> int:
    """
    Get the current version to work on.
    If latest version has all 234 predictions, return next version.
    Otherwise, return the latest version to continue filling it.
    """
    max_version = db.query(func.max(Prediction.version)).filter(
        Prediction.predicted_year == year
    ).scalar()

    if max_version is None:
        return 1

    # Count predictions for the max version
    count = db.query(func.count(Prediction.id)).filter(
        Prediction.predicted_year == year,
        Prediction.version == max_version
    ).scalar()

    # If max version has all 234 predictions, start next version
    if count >= 234:
        return max_version + 1
    else:
        # Continue with the current version
        return max_version


def get_constituencies_to_process(db: Session, year: int, version: int, constituency_ids=None, limit=None):
    """Get constituencies that don't have predictions for the given version"""
    # Find constituencies that already have predictions for this version
    existing = db.query(Prediction.constituency_id).filter(
        Prediction.predicted_year == year,
        Prediction.version == version
    ).all()
    existing_ids = [p[0] for p in existing]

    if constituency_ids:
        # Specific constituencies, excluding those already done
        query = db.query(Constituency).filter(
            Constituency.id.in_(constituency_ids),
            ~Constituency.id.in_(existing_ids) if existing_ids else True
        ).order_by(Constituency.ac_number)
    else:
        # All constituencies without predictions for this version
        query = db.query(Constituency).filter(
            ~Constituency.id.in_(existing_ids) if existing_ids else True
        ).order_by(Constituency.ac_number)

    if limit:
        query = query.limit(limit)

    return query.all()


def delete_version_predictions(db: Session, year: int, version: int) -> int:
    """Delete all predictions for a specific version"""
    count = db.query(Prediction).filter(
        Prediction.predicted_year == year,
        Prediction.version == version
    ).delete()
    db.commit()
    return count


def save_prediction(db: Session, prediction_data: dict, version: int) -> bool:
    """Save prediction to database with version"""
    try:
        # Convert top_alliances to JSON-serializable format
        top_candidates_json = []
        for alliance in prediction_data.get('top_alliances', []):
            top_candidates_json.append({
                'party': alliance.get('alliance'),  # Store alliance as party for now
                'vote_share': alliance.get('vote_share')
            })

        prediction = Prediction(
            constituency_id=prediction_data['constituency_id'],
            predicted_year=prediction_data['predicted_year'],
            version=version,
            predicted_winner_party=prediction_data['predicted_winner_party'],
            predicted_winner_name=prediction_data.get('predicted_winner_name'),
            confidence_level=prediction_data['confidence_level'],
            win_probability=prediction_data['win_probability'],
            predicted_vote_share=prediction_data['predicted_vote_share'],
            predicted_margin_pct=prediction_data['predicted_margin_pct'],
            top_candidates=top_candidates_json,
            swing_from_last_election=prediction_data['swing_from_last_election'],
            key_factors=prediction_data['key_factors'],
            prediction_model=prediction_data['prediction_model'],
            extra_data={
                **prediction_data.get('extra_data', {}),
                'predicted_winner_alliance': prediction_data.get('predicted_winner_alliance'),
                'top_alliances': prediction_data.get('top_alliances', [])
            }
        )

        db.add(prediction)
        db.commit()
        return True

    except Exception as e:
        print(f"Error saving prediction: {e}")
        db.rollback()
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Generate 2026 election predictions using ChatGPT"
    )
    parser.add_argument(
        "--model",
        default="gpt-5",
        help="OpenAI model to use (default: gpt-5)"
    )
    parser.add_argument(
        "--year",
        type=int,
        default=2026,
        help="Election year to predict (default: 2026)"
    )
    parser.add_argument(
        "--alliance-config",
        default="data/alliance_config_2026.json",
        help="Path to alliance configuration file"
    )
    parser.add_argument(
        "--trends-file",
        default="data/trends_2026_compiled.txt",
        help="Path to trends summary file"
    )
    parser.add_argument(
        "--constituency-ids",
        type=str,
        help="Comma-separated constituency IDs (optional, for testing)"
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
        help="Pause after N constituencies (default: 10)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of constituencies to process (for incremental runs)"
    )
    parser.add_argument(
        "--delete-version",
        type=int,
        default=None,
        help="Delete all predictions for a specific version and exit"
    )

    args = parser.parse_args()

    # Handle delete-version command
    if args.delete_version:
        db = SessionLocal()
        try:
            count = delete_version_predictions(db, args.year, args.delete_version)
            print(f"Deleted {count} predictions for version {args.delete_version}")
        finally:
            db.close()
        return

    # Validate API key
    if not settings.OPENAI_API_KEY:
        print("ERROR: OPENAI_API_KEY not found in environment!")
        sys.exit(1)

    # Load configuration files
    print("Loading configuration files...")
    try:
        alliance_config = load_alliance_config(args.alliance_config)
        trends_summary = load_trends_summary(args.trends_file)
        print(f"Loaded alliance config: {len(alliance_config['alliances'])} alliances")
        print(f"Loaded trends summary: {len(trends_summary)} characters")
    except Exception as e:
        print(f"ERROR loading config files: {e}")
        sys.exit(1)

    print()
    print("=" * 80)
    print("ELECTION PREDICTION GENERATION SCRIPT")
    print("=" * 80)
    print(f"Model: {args.model}")
    print(f"Predicted Year: {args.year}")
    print(f"Delay: {args.delay}s between calls")
    print(f"Batch size: {args.batch_size}")
    print()

    # Parse constituency IDs
    constituency_ids = None
    if args.constituency_ids:
        try:
            constituency_ids = [int(x.strip()) for x in args.constituency_ids.split(",")]
            print(f"Processing specific constituencies: {constituency_ids}")
        except ValueError:
            print("ERROR: Invalid constituency IDs format")
            sys.exit(1)

    # Get database session
    db = SessionLocal()

    try:
        # Determine version for this prediction run
        next_version = get_current_version(db, args.year)

        # Count existing predictions for this version
        existing_count = db.query(func.count(Prediction.id)).filter(
            Prediction.predicted_year == args.year,
            Prediction.version == next_version
        ).scalar()

        print(f"Prediction version: {next_version}")
        print(f"Already completed: {existing_count}/234")
        print()

        # Get constituencies to process (those missing predictions for this version)
        print("Checking database...")
        constituencies = get_constituencies_to_process(
            db, args.year, next_version, constituency_ids, args.limit
        )

        total_count = len(constituencies)
        print(f"Found {total_count} constituencies to process")
        print()

        if total_count == 0:
            print("No constituencies to process. Exiting.")
            return

        # Confirm
        response = input(f"Proceed with generating version {next_version} predictions for {total_count} constituencies? (yes/no): ")
        if response.lower() != "yes":
            print("Aborted.")
            return

        print("\nStarting prediction generation...\n")

        # Track stats
        successful = 0
        failed = 0
        failed_list = []
        start_time = datetime.now()

        # Process each constituency
        for idx, constituency in enumerate(constituencies, 1):
            print(f"[{idx}/{total_count}] {constituency.name} (AC #{constituency.ac_number})")
            print(f"    District: {constituency.district} | Region: {constituency.region}")
            print(f"    Generating prediction...", end=" ", flush=True)

            # Generate prediction
            prediction_data = generate_prediction_for_constituency(
                constituency_id=constituency.id,
                db=db,
                alliance_config=alliance_config,
                trends_summary=trends_summary,
                api_key=settings.OPENAI_API_KEY,
                model=args.model
            )

            if prediction_data:
                print("✓")
                print(f"    Winner: {prediction_data['predicted_winner_alliance']} ({prediction_data['predicted_winner_party']})")
                print(f"    Confidence: {prediction_data['confidence_level']} ({prediction_data['win_probability']:.0%})")
                print(f"    Vote Share: {prediction_data['predicted_vote_share']:.1f}% (Margin: {prediction_data['predicted_margin_pct']:.1f}%)")

                # Save to database
                if save_prediction(db, prediction_data, next_version):
                    print(f"    ✓ Saved to database (version {next_version})")
                    successful += 1
                else:
                    print(f"    ✗ Failed to save")
                    failed += 1
                    failed_list.append({
                        'id': constituency.id,
                        'name': constituency.name,
                        'reason': 'Database save failed'
                    })
            else:
                print("✗ Failed")
                failed += 1
                failed_list.append({
                    'id': constituency.id,
                    'name': constituency.name,
                    'reason': 'Prediction generation failed'
                })

            print()

            # Delay
            if idx < total_count:
                time.sleep(args.delay)

            # Batch pause
            if idx % args.batch_size == 0 and idx < total_count:
                print(f"--- Batch complete ({idx}/{total_count}). Pausing 2s ---")
                print()
                time.sleep(2)

        # Summary
        end_time = datetime.now()
        duration = end_time - start_time

        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Version: {next_version}")
        print(f"Total processed: {total_count}")
        print(f"Successful: {successful}")
        print(f"Failed: {failed}")
        print(f"Time taken: {duration}")
        print()

        if failed_list:
            print("Failed constituencies:")
            for item in failed_list:
                print(f"  - {item['name']} (ID: {item['id']}): {item['reason']}")
            print()

            # Save failed list
            failed_file = "failed_predictions.json"
            with open(failed_file, "w") as f:
                json.dump(failed_list, f, indent=2)
            print(f"Failed list saved to: {failed_file}")
            print()

            # Retry command
            failed_ids = [str(item['id']) for item in failed_list]
            print("To retry failures:")
            print(f"poetry run python scripts/generate_predictions.py --constituency-ids {','.join(failed_ids)}")
            print()

        print("Done!")

    finally:
        db.close()


if __name__ == "__main__":
    main()
