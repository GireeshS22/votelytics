"""
V3 Batch Prediction Generator — Grok + X Search
=================================================
Generates 2026 election predictions for all 234 Tamil Nadu constituencies
using xAI Grok with live X Search via the Batch API (50% cost reduction).

Usage:
    # Step 1: Submit all 234 requests as a single batch
    poetry run python scripts/v3_batch_predictions.py --submit

    # Step 2: Check progress (call anytime)
    poetry run python scripts/v3_batch_predictions.py --status

    # Step 3: Collect results and save to DB (once batch is complete)
    poetry run python scripts/v3_batch_predictions.py --collect

    # Step 3 (alternative): Wait for completion then auto-collect
    poetry run python scripts/v3_batch_predictions.py --collect --wait

    # Test with a few constituencies before full run
    poetry run python scripts/v3_batch_predictions.py --submit --limit 5
"""

import sys
import os
import json
import time
import re
import argparse
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from xai_sdk import Client
from xai_sdk.chat import user
from xai_sdk.tools import x_search

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.prediction import Prediction
from app.config import settings
from app.services.prediction_generator import (
    load_alliance_config,
    load_trends_summary,
    fetch_constituency_historical_data,
    build_prediction_prompt,
    fetch_previous_prediction,
)


# ── Constants ────────────────────────────────────────────────────────────────

YEAR = 2026
DEFAULT_MODEL = "grok-4-fast-reasoning"

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BATCH_STATE_FILE   = os.path.join(_BASE, "data", "batch_state_v3.json")
ALLIANCE_CONFIG    = os.path.join(_BASE, "data", "alliance_config_2026.json")
TRENDS_FILE        = os.path.join(_BASE, "data", "trends_2026_compiled.txt")

# These are the exact fields save_prediction() reads from prediction_data.
# Any Grok response missing one of these will be rejected before touching the DB.
REQUIRED_FIELDS = [
    "predicted_winner_alliance",
    "predicted_winner_party",
    "confidence_level",
    "win_probability",
    "predicted_vote_share",
    "predicted_margin_pct",
    "top_alliances",
    "swing_from_last_election",
    "key_factors",
]

VALID_CONFIDENCE_LEVELS = {"Safe", "Likely", "Lean", "Toss-up"}


# ── JSON extraction ──────────────────────────────────────────────────────────

def extract_json_from_response(content: str) -> dict | None:
    """
    Robustly extract the prediction JSON from Grok's response.

    Grok reasoning models may output thinking traces or preamble text before
    the JSON. We try three strategies in order:
      1. Direct parse (clean response)
      2. Strip markdown code fences (```json ... ```)
      3. Find the last/outermost {...} object in the string
    """
    if not content:
        return None

    content = content.strip()

    # Strategy 1: clean JSON
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Strategy 2: markdown code fence  ```json { ... } ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Strategy 3: find the last outermost { ... } block
    # Reasoning models often put explanation first and JSON at the end.
    for start in reversed([m.start() for m in re.finditer(r"\{", content)]):
        depth = 0
        for i, ch in enumerate(content[start:]):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = content[start : start + i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    return None


# ── Validation ───────────────────────────────────────────────────────────────

def validate_and_normalise(data: dict) -> tuple[bool, str]:
    """
    Validate all required fields exist and have compatible types.
    Normalises minor variations (e.g. capitalisation of confidence_level)
    so downstream save_prediction() never sees unexpected values.

    Returns (ok: bool, reason: str).
    """
    for field in REQUIRED_FIELDS:
        if field not in data:
            return False, f"Missing required field: '{field}'"

    # win_probability must be 0–1
    if not isinstance(data["win_probability"], (int, float)):
        return False, "win_probability must be numeric"
    if not 0 <= float(data["win_probability"]) <= 1:
        # Grok sometimes returns 0–100 scale by mistake — fix it
        if 0 <= float(data["win_probability"]) <= 100:
            data["win_probability"] = float(data["win_probability"]) / 100
        else:
            return False, f"win_probability out of range: {data['win_probability']}"

    # Vote share / margin must be numeric
    for field in ("predicted_vote_share", "predicted_margin_pct"):
        if not isinstance(data[field], (int, float)):
            return False, f"{field} must be numeric"

    # swing can be negative — just must be numeric
    if not isinstance(data["swing_from_last_election"], (int, float)):
        return False, "swing_from_last_election must be numeric"

    # top_alliances must be a non-empty list with 'alliance' and 'vote_share' keys
    # This matches exactly what save_prediction() reads:
    #   alliance.get('alliance') → top_candidates[i]['party']
    #   alliance.get('vote_share') → top_candidates[i]['vote_share']
    if not isinstance(data["top_alliances"], list) or len(data["top_alliances"]) == 0:
        return False, "top_alliances must be a non-empty list"
    for item in data["top_alliances"]:
        if "alliance" not in item:
            return False, f"top_alliances item missing 'alliance' key: {item}"
        if "vote_share" not in item:
            return False, f"top_alliances item missing 'vote_share' key: {item}"

    # Normalise confidence_level capitalisation
    cl = str(data["confidence_level"]).strip()
    normalised = {c.lower(): c for c in VALID_CONFIDENCE_LEVELS}
    if cl not in VALID_CONFIDENCE_LEVELS:
        if cl.lower() in normalised:
            data["confidence_level"] = normalised[cl.lower()]
        else:
            # Fallback — don't reject, treat as Toss-up
            data["confidence_level"] = "Toss-up"

    return True, "OK"


# ── DB save ───────────────────────────────────────────────────────────────────

def save_prediction(db: Session, prediction_data: dict, version: int) -> bool:
    """
    Save a single prediction to the DB.

    IMPORTANT: This function is intentionally kept byte-for-byte identical
    to save_prediction() in generate_predictions.py so that V3 rows are
    structurally indistinguishable from V1/V2 rows in the predictions table.

    The only V3-specific fields live inside extra_data (alliance_config_version,
    trends_date, x_search_enabled, batch_id) which are additive and do not
    affect any existing API parsing logic.
    """
    try:
        # Build top_candidates JSON exactly as V1/V2 does:
        # alliance.get('alliance') is stored as 'party' — this is the V1/V2 contract.
        top_candidates_json = []
        for alliance in prediction_data.get("top_alliances", []):
            top_candidates_json.append({
                "party": alliance.get("alliance"),
                "vote_share": alliance.get("vote_share"),
            })

        prediction = Prediction(
            constituency_id=prediction_data["constituency_id"],
            predicted_year=prediction_data["predicted_year"],
            version=version,
            predicted_winner_party=prediction_data["predicted_winner_party"],
            predicted_winner_name=prediction_data.get("predicted_winner_name"),
            confidence_level=prediction_data["confidence_level"],
            win_probability=prediction_data["win_probability"],
            predicted_vote_share=prediction_data["predicted_vote_share"],
            predicted_margin_pct=prediction_data["predicted_margin_pct"],
            top_candidates=top_candidates_json,
            swing_from_last_election=prediction_data["swing_from_last_election"],
            key_factors=prediction_data["key_factors"],
            prediction_model=prediction_data["prediction_model"],
            extra_data={
                **prediction_data.get("extra_data", {}),
                "predicted_winner_alliance": prediction_data.get("predicted_winner_alliance"),
                "top_alliances": prediction_data.get("top_alliances", []),
            },
        )

        db.add(prediction)
        db.commit()
        return True

    except Exception as e:
        print(f"    DB error: {e}")
        db.rollback()
        return False


# ── Version detection ────────────────────────────────────────────────────────

def get_next_version(db: Session, year: int) -> int:
    """Return the version number to use for this run."""
    max_version = db.query(func.max(Prediction.version)).filter(
        Prediction.predicted_year == year
    ).scalar()

    if max_version is None:
        return 1

    count = db.query(func.count(Prediction.id)).filter(
        Prediction.predicted_year == year,
        Prediction.version == max_version,
    ).scalar()

    return max_version + 1 if count >= 234 else max_version


# ── Prompt builder ───────────────────────────────────────────────────────────

def build_grok_prompt(
    constituency_data: dict,
    alliance_config: dict,
    trends_summary: str,
    previous_prediction: dict | None,
) -> str:
    """
    Wrap the existing build_prediction_prompt() with:
      1. An X Search instruction prefix so Grok knows to search before reasoning.
      2. A stricter JSON-only output instruction suffix for reasoning models.

    The base prompt body is unchanged so the expected JSON schema stays the same.
    """
    const = constituency_data["constituency"]

    x_search_prefix = f"""Before analysing, use x_search to find recent ground-level information. Search for:
1. "{const['name']} election 2026"
2. "{const['name']} candidate 2026"
3. "{const['district']} Tamil Nadu politics 2026"

Incorporate any candidate announcements, rally reports, local controversies, or voter sentiment you find into your prediction.

---

"""

    base_prompt = build_prediction_prompt(
        constituency_data=constituency_data,
        alliance_config=alliance_config,
        trends_summary=trends_summary,
        previous_prediction=previous_prediction,
    )

    # Reasoning models may include a summary after the JSON.
    # This suffix overrides the base prompt's closing instruction.
    strict_suffix = """

CRITICAL OUTPUT RULE:
Your entire response must be ONLY the raw JSON object — no markdown, no code fences,
no preamble, no explanation, no trailing text.
Begin your response with { and end with }. Nothing else.
"""

    return x_search_prefix + base_prompt + strict_suffix


# ── --submit ─────────────────────────────────────────────────────────────────

def cmd_submit(args):
    if not settings.XAI_API_KEY:
        print("ERROR: XAI_API_KEY not set in server/.env")
        sys.exit(1)

    alliance_config = load_alliance_config(ALLIANCE_CONFIG)
    trends_summary  = load_trends_summary(TRENDS_FILE)
    db     = SessionLocal()
    client = Client(api_key=settings.XAI_API_KEY)

    try:
        version = get_next_version(db, YEAR)
        print(f"Prediction version : {version}")
        print(f"Model              : {args.model}")
        print()

        # Guard against re-submitting the same version
        if os.path.exists(BATCH_STATE_FILE):
            with open(BATCH_STATE_FILE) as f:
                saved_state = json.load(f)
            if saved_state.get("version") == version:
                print(f"Batch already submitted for version {version}.")
                print(f"Batch ID : {saved_state['batch_id']}")
                print("Use --status or --collect to proceed.")
                return

        # Constituencies not yet predicted for this version
        done_ids = {
            row[0]
            for row in db.query(Prediction.constituency_id).filter(
                Prediction.predicted_year == YEAR,
                Prediction.version == version,
            ).all()
        }

        all_constituencies = (
            db.query(Constituency).order_by(Constituency.ac_number).all()
        )
        to_process = [c for c in all_constituencies if c.id not in done_ids]

        if args.limit:
            to_process = to_process[: args.limit]

        print(f"Total constituencies : 234")
        print(f"Already done         : {len(done_ids)}")
        print(f"To submit            : {len(to_process)}")
        print()

        if not to_process:
            print("All constituencies already have predictions for this version.")
            return

        confirm = input(
            f"Submit {len(to_process)} requests to Grok batch (version {version})? (yes/no): "
        )
        if confirm.lower() != "yes":
            print("Aborted.")
            return

        # Create batch
        batch = client.batch.create(
            batch_name=f"votelytics_v{version}_predictions_{YEAR}"
        )
        batch_id = batch.batch_id
        print(f"\nBatch created : {batch_id}")
        print("Building prompts...")

        batch_requests   = []
        constituency_map = {}   # batch_request_id → constituency_id (saved in state file)
        skipped          = []

        for i, constituency in enumerate(to_process):
            constituency_data = fetch_constituency_historical_data(
                constituency_id=constituency.id,
                db=db,
                alliance_mapping=alliance_config["party_mapping"],
            )
            if not constituency_data:
                skipped.append(constituency.name)
                continue

            previous_prediction = fetch_previous_prediction(constituency.id, db)

            prompt = build_grok_prompt(
                constituency_data=constituency_data,
                alliance_config=alliance_config,
                trends_summary=trends_summary,
                previous_prediction=previous_prediction,
            )

            batch_request_id = f"constituency_{constituency.id}"

            chat = client.chat.create(
                model=args.model,
                batch_request_id=batch_request_id,
                tools=[x_search()],
                max_tokens=2000,
            )
            chat.append(user(prompt))
            batch_requests.append(chat)
            constituency_map[batch_request_id] = constituency.id

            if (i + 1) % 50 == 0:
                print(f"  Built {i + 1}/{len(to_process)} prompts...")

        if not batch_requests:
            print("No valid requests to submit.")
            return

        # Submit all at once
        print(f"\nSubmitting {len(batch_requests)} requests...")
        client.batch.add(batch_id=batch_id, batch_requests=batch_requests)
        print("Submitted successfully.\n")

        if skipped:
            print(f"Skipped (no historical data): {skipped}\n")

        # Persist state so --status and --collect can find the batch
        state = {
            "batch_id":         batch_id,
            "version":          version,
            "year":             YEAR,
            "model":            args.model,
            "submitted_at":     datetime.now().isoformat(),
            "total_requests":   len(batch_requests),
            "constituency_map": constituency_map,
        }
        os.makedirs(os.path.dirname(BATCH_STATE_FILE), exist_ok=True)
        with open(BATCH_STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)

        print(f"Batch state saved : {BATCH_STATE_FILE}")
        print()
        print("Next steps:")
        print("  Check progress : poetry run python scripts/v3_batch_predictions.py --status")
        print("  Collect results: poetry run python scripts/v3_batch_predictions.py --collect")

    finally:
        db.close()


# ── --status ──────────────────────────────────────────────────────────────────

def cmd_status(args):
    if not os.path.exists(BATCH_STATE_FILE):
        print("No batch state found. Run --submit first.")
        return

    with open(BATCH_STATE_FILE) as f:
        state = json.load(f)

    if not settings.XAI_API_KEY:
        print("ERROR: XAI_API_KEY not set in server/.env")
        sys.exit(1)

    client = Client(api_key=settings.XAI_API_KEY)
    batch  = client.batch.get(batch_id=state["batch_id"])
    s      = batch.state

    done  = s.num_success + s.num_error
    total = s.num_requests
    pct   = (done / total * 100) if total else 0

    print(f"Batch ID    : {state['batch_id']}")
    print(f"Version     : {state['version']}")
    print(f"Model       : {state['model']}")
    print(f"Submitted   : {state['submitted_at']}")
    print()
    print(f"Progress    : {done}/{total}  ({pct:.1f}%)")
    print(f"  Pending   : {s.num_pending}")
    print(f"  Success   : {s.num_success}")
    print(f"  Failed    : {s.num_error}")
    print(f"  Cancelled : {s.num_cancelled}")

    if s.num_pending == 0:
        print("\nBatch complete! Run --collect to save to DB.")
        try:
            cost = batch.cost_breakdown.total_cost_usd_ticks / 1e10
            print(f"Total cost  : ${cost:.4f}")
        except Exception:
            pass


# ── --collect ─────────────────────────────────────────────────────────────────

def cmd_collect(args):
    if not os.path.exists(BATCH_STATE_FILE):
        print("No batch state found. Run --submit first.")
        return

    with open(BATCH_STATE_FILE) as f:
        state = json.load(f)

    if not settings.XAI_API_KEY:
        print("ERROR: XAI_API_KEY not set in server/.env")
        sys.exit(1)

    client   = Client(api_key=settings.XAI_API_KEY)
    db       = SessionLocal()
    batch_id = state["batch_id"]
    version  = state["version"]
    # constituency_map: "constituency_123" → 123
    constituency_map: dict[str, int] = state["constituency_map"]

    try:
        # Optionally wait until all requests finish
        if args.wait:
            print("Waiting for batch to complete (polling every 60s)...")
            while True:
                batch  = client.batch.get(batch_id=batch_id)
                s      = batch.state
                done   = s.num_success + s.num_error
                print(
                    f"\r  {done}/{s.num_requests} done  ({s.num_pending} pending)  ",
                    end="",
                    flush=True,
                )
                if s.num_pending == 0:
                    print("\nBatch complete!")
                    break
                time.sleep(60)
        else:
            batch = client.batch.get(batch_id=batch_id)
            if batch.state.num_pending > 0:
                print(
                    f"Batch still processing: {batch.state.num_pending} requests pending.\n"
                    "Run --collect --wait to block until done, or try again later."
                )
                return

        # Paginate through all results
        print(f"\nCollecting results from batch {batch_id}...")
        all_succeeded = []
        all_failed    = []
        pagination_token = None

        while True:
            page = client.batch.list_batch_results(
                batch_id=batch_id,
                limit=100,
                pagination_token=pagination_token,
            )
            all_succeeded.extend(page.succeeded)
            all_failed.extend(page.failed)
            pagination_token = page.pagination_token
            if pagination_token is None:
                break

        print(f"Retrieved : {len(all_succeeded)} succeeded, {len(all_failed)} failed\n")

        # Process each successful result
        saved        = 0
        parse_errors = []
        save_errors  = []

        for result in all_succeeded:
            bid              = result.batch_request_id
            constituency_id  = constituency_map.get(bid)

            if constituency_id is None:
                print(f"  WARNING: unknown batch_request_id '{bid}' — skipping")
                continue

            # Idempotent: skip if already saved (safe to re-run --collect)
            already_saved = db.query(Prediction).filter(
                Prediction.constituency_id == constituency_id,
                Prediction.predicted_year  == YEAR,
                Prediction.version         == version,
            ).first()
            if already_saved:
                continue

            # ── Extract JSON ──────────────────────────────────────────────
            content         = result.response.content
            prediction_data = extract_json_from_response(content)

            if prediction_data is None:
                parse_errors.append({
                    "batch_request_id": bid,
                    "constituency_id":  constituency_id,
                    "reason":           "JSON extraction failed",
                    "content_preview":  (content or "")[:300],
                })
                continue

            # ── Validate & normalise ──────────────────────────────────────
            ok, reason = validate_and_normalise(prediction_data)
            if not ok:
                parse_errors.append({
                    "batch_request_id": bid,
                    "constituency_id":  constituency_id,
                    "reason":           reason,
                    "content_preview":  (content or "")[:300],
                })
                continue

            # ── Add metadata (mirrors generate_predictions.py exactly) ────
            prediction_data["constituency_id"]  = constituency_id
            prediction_data["predicted_year"]   = YEAR
            prediction_data["prediction_model"] = f"Grok ({state['model']})"
            prediction_data["extra_data"]       = {
                "alliance_config_version":      "2026_v3",
                "trends_date":                  "2026-03",
                "historical_data_years":        [2021, 2016, 2011],
                "previous_prediction_version":  version - 1,
                "x_search_enabled":             True,
                "batch_id":                     batch_id,
            }

            # ── Save to DB ────────────────────────────────────────────────
            if save_prediction(db, prediction_data, version):
                saved += 1
                if saved % 20 == 0:
                    print(f"  Saved {saved} predictions...")
            else:
                save_errors.append({
                    "batch_request_id": bid,
                    "constituency_id":  constituency_id,
                })

        # ── Summary ───────────────────────────────────────────────────────
        print()
        print("=" * 60)
        print("COLLECTION SUMMARY")
        print("=" * 60)
        print(f"Version         : {version}")
        print(f"Batch successes : {len(all_succeeded)}")
        print(f"Batch failures  : {len(all_failed)}")
        print(f"Saved to DB     : {saved}")
        print(f"Parse errors    : {len(parse_errors)}")
        print(f"DB save errors  : {len(save_errors)}")

        # Cost
        try:
            batch  = client.batch.get(batch_id=batch_id)
            cost   = batch.cost_breakdown.total_cost_usd_ticks / 1e10
            print(f"Total cost      : ${cost:.4f}")
        except Exception:
            pass

        # Save error report for investigation / retry
        if parse_errors or save_errors or all_failed:
            errors = {
                "parse_errors": parse_errors,
                "save_errors":  save_errors,
                "batch_failures": [
                    {"batch_request_id": r.batch_request_id, "error": r.error_message}
                    for r in all_failed
                ],
            }
            error_file = BATCH_STATE_FILE.replace(".json", "_errors.json")
            with open(error_file, "w") as f:
                json.dump(errors, f, indent=2)
            print(f"\nError details   : {error_file}")

            # Convenience retry command using the existing sequential script
            retry_ids = list({
                str(constituency_map.get(r.batch_request_id))
                for r in all_failed
                if constituency_map.get(r.batch_request_id)
            } | {
                str(e["constituency_id"])
                for e in parse_errors
            })
            if retry_ids:
                print("\nRetry failures via sequential script:")
                print(
                    f"  poetry run python scripts/generate_predictions.py "
                    f"--constituency-ids {','.join(retry_ids)}"
                )

        print("\nDone!")

    finally:
        db.close()


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="V3 batch predictions — Grok + X Search"
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--submit",  action="store_true", help="Submit batch to Grok")
    group.add_argument("--status",  action="store_true", help="Check batch progress")
    group.add_argument("--collect", action="store_true", help="Save results to DB")

    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Grok model (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only submit first N constituencies (for test runs)",
    )
    parser.add_argument(
        "--wait",
        action="store_true",
        help="With --collect: poll until batch finishes before collecting",
    )

    args = parser.parse_args()

    if args.submit:
        cmd_submit(args)
    elif args.status:
        cmd_status(args)
    elif args.collect:
        cmd_collect(args)


if __name__ == "__main__":
    main()
