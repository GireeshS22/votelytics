"""
V3 Prediction Generator — Grok + X Search
==========================================
Generates 2026 election predictions for all 234 Tamil Nadu constituencies
using xAI Grok with live X Search.

Usage:
    poetry run python scripts/v3_batch_predictions.py
    poetry run python scripts/v3_batch_predictions.py --limit 5
    poetry run python scripts/v3_batch_predictions.py --constituency-ids 1,2,3
"""

import sys
import os
import time
import json
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
    fetch_constituency_historical_data,
    build_prediction_prompt,
    fetch_previous_prediction,
)


# ── Constants ─────────────────────────────────────────────────────────────────

YEAR          = 2026
DEFAULT_MODEL = "grok-4.20-0309-reasoning"

_BASE           = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLIANCE_CONFIG = os.path.join(_BASE, "data", "alliance_config_2026.json")
TRENDS_FILE     = os.path.join(_BASE, "data", "trends_2026_compiled.txt")

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


# ── V3 combined trends ────────────────────────────────────────────────────────

_V2_JANUARY_2026_CONTEXT = """
================================================================================
CONTEXT V2 — JANUARY 2026
================================================================================
GOVERNMENT: DMK incumbent (2021-2026) facing mixed performance
- Criticized for law & order failures and corruption allegations
- Strong on welfare schemes (women's assistance, free bus rides, breakfast schemes)
- Clean sweep in 2024 Lok Sabha (39/39 seats) provides momentum
- Significant anti-incumbency sentiment detected

ALLIANCES (January 2026):
- DMK-led Secular Progressive Alliance (SPA) - 13 partners, largely intact
- AIADMK-BJP NDA alliance - CONSOLIDATED with PMK (Anbumani) and AMMK joining
- TVK (Actor Vijay) - standalone, KA Sengottaiyan joined as chief coordinator (Nov 2025)
- NTK (Seeman) - standalone, contesting all 234 seats
- DMDK - undecided as of Jan 25, 2026

MAJOR DEVELOPMENTS (Late 2025 - January 2026):
- PMK (Anbumani faction) joined NDA - January 7, 2026
- AMMK (TTV Dhinakaran) rejoined NDA - January 22-23, 2026
- KA Sengottaiyan (ex-AIADMK) joined TVK - November 2025
- PM Modi rally at Madurantakam - January 23, 2026 (unified NDA front, EPS as CM candidate)
- NDA consolidation gaining momentum

TOP VOTER CONCERNS:
1. Women Safety (27.3%)
2. Liquor & Drug Menace (21.8%)
3. Unemployment (17.6%)
4. Corruption (14.2%)
5. Language/Cultural Identity (9.5%)
6. Inflation (6.4%)

KEY DYNAMICS:
- Tamil Nadu historically alternates DMK and AIADMK
- NDA consolidation (PMK + AMMK) strengthens opposition front
- Anti-incumbency vs welfare schemes
- Four-way split: DMK+ vs NDA vs TVK vs NTK
- TVK as wildcard for splitting anti-incumbency votes
"""

_V3_MARCH_2026_CONTEXT = """
================================================================================
CONTEXT V3 — MARCH 2026 (PRE-ELECTION — SUPPLEMENT WITH X SEARCH)
================================================================================
ELECTION IMMINENT:
- Tamil Nadu Assembly election due April-May 2026 (assembly term ends May 10, 2026)
- Campaign period now active — candidates being finalised and announced

ALLIANCE STATUS (March 2026 — CONFIRMED):
- DMK+ (SPA): Now 14 partners — DMDK (Premallatha Vijayakant) officially joined March 2026
  CM candidate: MK Stalin
- AIADMK+ (NDA): AIADMK + BJP + PMK + AMMK — EPS as CM candidate
- TVK (Vijay): Standalone — finalising candidate list
- NTK (Seeman): Standalone — contesting all 234 seats

IMPORTANT: Use your x_search results to update with the very latest — candidate names,
recent rallies, local controversies, and current ground sentiment.
"""


def load_v3_combined_trends() -> str:
    with open(TRENDS_FILE, "r") as f:
        v1_context = f.read().strip()

    v1_section = f"""================================================================================
CONTEXT V1 — NOVEMBER 2025 (Original Research Compilation)
================================================================================
{v1_context}
"""
    return v1_section + _V2_JANUARY_2026_CONTEXT + _V3_MARCH_2026_CONTEXT


# ── Prompt builder ────────────────────────────────────────────────────────────

def build_grok_prompt(
    constituency_data: dict,
    alliance_config: dict,
    trends_summary: str,
    previous_prediction: dict | None,
) -> str:
    const = constituency_data["constituency"]

    x_search_prefix = f"""STEP 1 — RESEARCH (do this first using x_search):
Search X for ground-level information about this specific constituency before predicting.
Run these searches:
1. "{const['name']} election 2026"
2. "{const['name']} candidate 2026"
3. "{const['district']} Tamil Nadu politics 2026"
4. "{const['name']} MLA"

What to look for: candidate announcements, recent rallies, local MLA performance,
caste-level dynamics, voter sentiment, any local controversies.

STEP 2 — ANALYSE AND PREDICT (using everything below + your x_search findings):

---

"""

    base_prompt = build_prediction_prompt(
        constituency_data=constituency_data,
        alliance_config=alliance_config,
        trends_summary=trends_summary,
        previous_prediction=previous_prediction,
    )

    base_prompt = base_prompt.replace(
        "- Four-way contest dynamics",
        "- Four-way contest dynamics\n- Your x_search findings about this specific constituency",
    )

    strict_suffix = """

CRITICAL OUTPUT RULE:
Your entire response must be ONLY the raw JSON object — no markdown, no code fences,
no preamble, no explanation, no trailing text.
Begin your response with { and end with }. Nothing else.
"""

    return x_search_prefix + base_prompt + strict_suffix


# ── JSON extraction ───────────────────────────────────────────────────────────

def extract_json_from_response(content: str) -> dict | None:
    if not content:
        return None

    content = content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

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


# ── Validation ────────────────────────────────────────────────────────────────

def validate_and_normalise(data: dict) -> tuple[bool, str]:
    for field in REQUIRED_FIELDS:
        if field not in data:
            return False, f"Missing required field: '{field}'"

    if not isinstance(data["win_probability"], (int, float)):
        return False, "win_probability must be numeric"
    if not 0 <= float(data["win_probability"]) <= 1:
        if 0 <= float(data["win_probability"]) <= 100:
            data["win_probability"] = float(data["win_probability"]) / 100
        else:
            return False, f"win_probability out of range: {data['win_probability']}"

    for field in ("predicted_vote_share", "predicted_margin_pct"):
        if not isinstance(data[field], (int, float)):
            return False, f"{field} must be numeric"

    if not isinstance(data["swing_from_last_election"], (int, float)):
        return False, "swing_from_last_election must be numeric"

    if not isinstance(data["top_alliances"], list) or len(data["top_alliances"]) == 0:
        return False, "top_alliances must be a non-empty list"
    for item in data["top_alliances"]:
        if "alliance" not in item or "vote_share" not in item:
            return False, f"top_alliances item missing keys: {item}"

    # Always enforce confidence_level from the numbers — don't trust model's label.
    # Thresholds calibrated so ~20 seats are Toss-up for 234-seat TN election.
    wp     = float(data["win_probability"])
    margin = float(data["predicted_margin_pct"])
    if wp < 0.50 and margin < 2.5:
        data["confidence_level"] = "Toss-up"
    elif wp >= 0.65 and margin >= 10:
        data["confidence_level"] = "Safe"
    elif wp >= 0.55 and margin >= 7:
        data["confidence_level"] = "Likely"
    else:
        data["confidence_level"] = "Lean"

    return True, "OK"


# ── DB save ───────────────────────────────────────────────────────────────────

def save_prediction(db: Session, prediction_data: dict, version: int) -> bool:
    try:
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


# ── Version detection ─────────────────────────────────────────────────────────

def get_current_version(db: Session, year: int) -> int:
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


# ── Grok call ────────────────────────────────────────────────────────────────

def generate_prediction_grok(
    client: Client,
    constituency_id: int,
    db: Session,
    alliance_config: dict,
    trends_summary: str,
    model: str,
) -> dict | None:
    constituency_data = fetch_constituency_historical_data(
        constituency_id=constituency_id,
        db=db,
        alliance_mapping=alliance_config["party_mapping"],
    )
    if not constituency_data:
        return None

    previous_prediction = fetch_previous_prediction(constituency_id, db)

    prompt = build_grok_prompt(
        constituency_data=constituency_data,
        alliance_config=alliance_config,
        trends_summary=trends_summary,
        previous_prediction=previous_prediction,
    )

    chat = client.chat.create(
        model=model,
        tools=[x_search()],
        max_tokens=4000,
    )
    chat.append(user(prompt))

    print(f"\n    [DEBUG] Calling chat.sample()...")
    response = chat.sample()
    print(f"    [DEBUG] Response type: {type(response)}")
    print(f"    [DEBUG] Response attrs: {[a for a in dir(response) if not a.startswith('_')]}")

    content = response.content
    reasoning = response.reasoning_content if hasattr(response, "reasoning_content") else ""

    print(f"    [DEBUG] content length: {len(content or '')}")
    print(f"    [DEBUG] reasoning length: {len(reasoning or '')}")
    print(f"    [DEBUG] content preview: {(content or '')[:200]}")

    if not content:
        content = reasoning

    prediction_data = extract_json_from_response(content)
    if prediction_data is None:
        print(f"    Parse error. Raw response (first 300): {(content or '')[:300]}")
        return None

    ok, reason = validate_and_normalise(prediction_data)
    if not ok:
        print(f"    Validation error: {reason}")
        return None

    const = constituency_data["constituency"]
    prediction_data["constituency_id"]  = constituency_id
    prediction_data["predicted_year"]   = YEAR
    prediction_data["prediction_model"] = f"Grok ({model})"
    prediction_data["extra_data"]       = {
        "alliance_config_version":     "2026_v3",
        "trends_date":                 "2026-03",
        "historical_data_years":       [2021, 2016, 2011],
        "previous_prediction_version": 2,
        "x_search_enabled":            True,
    }

    return prediction_data


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="V3 predictions — Grok + X Search"
    )
    parser.add_argument("--model",  default=DEFAULT_MODEL)
    parser.add_argument("--limit",  type=int, default=None)
    parser.add_argument("--constituency-ids", type=str, default=None)
    parser.add_argument("--delay",  type=int, default=2, help="Seconds between calls")
    parser.add_argument("--delete-version", type=int, default=None)
    args = parser.parse_args()

    if not settings.XAI_API_KEY:
        print("ERROR: XAI_API_KEY not set in server/.env")
        sys.exit(1)

    db = SessionLocal()

    try:
        if args.delete_version:
            count = db.query(Prediction).filter(
                Prediction.predicted_year == YEAR,
                Prediction.version == args.delete_version,
            ).delete()
            db.commit()
            print(f"Deleted {count} predictions for version {args.delete_version}")
            return

        alliance_config = load_alliance_config(ALLIANCE_CONFIG)
        trends_summary  = load_v3_combined_trends()
        client          = Client(api_key=settings.XAI_API_KEY)

        version = get_current_version(db, YEAR)

        existing_count = db.query(func.count(Prediction.id)).filter(
            Prediction.predicted_year == YEAR,
            Prediction.version == version,
        ).scalar()

        print("=" * 70)
        print("V3 PREDICTION GENERATION — GROK + X SEARCH")
        print("=" * 70)
        print(f"Model              : {args.model}")
        print(f"Prediction version : {version}")
        print(f"Already completed  : {existing_count}/234")
        print()

        # Build constituency list
        existing_ids = {
            row[0]
            for row in db.query(Prediction.constituency_id).filter(
                Prediction.predicted_year == YEAR,
                Prediction.version == version,
            ).all()
        }

        if args.constituency_ids:
            ids = [int(x.strip()) for x in args.constituency_ids.split(",")]
            constituencies = (
                db.query(Constituency)
                .filter(Constituency.id.in_(ids), ~Constituency.id.in_(existing_ids))
                .order_by(Constituency.ac_number)
                .all()
            )
        else:
            q = db.query(Constituency).filter(
                ~Constituency.id.in_(existing_ids)
            ).order_by(Constituency.ac_number)
            if args.limit:
                q = q.limit(args.limit)
            constituencies = q.all()

        total = len(constituencies)
        print(f"To process : {total}")
        print()

        if total == 0:
            print("Nothing to process.")
            return

        confirm = input(f"Proceed with {total} constituencies? (yes/no): ")
        if confirm.lower() != "yes":
            print("Aborted.")
            return

        print()

        successful  = 0
        failed      = 0
        failed_list = []
        start_time  = datetime.now()

        for idx, constituency in enumerate(constituencies, 1):
            print(f"[{idx}/{total}] {constituency.name} (AC #{constituency.ac_number}) — {constituency.district}")
            print(f"    Calling Grok...", end=" ", flush=True)

            try:
                prediction_data = generate_prediction_grok(
                    client=client,
                    constituency_id=constituency.id,
                    db=db,
                    alliance_config=alliance_config,
                    trends_summary=trends_summary,
                    model=args.model,
                )
            except Exception as e:
                print(f"ERROR: {e}")
                failed += 1
                failed_list.append({"id": constituency.id, "name": constituency.name, "reason": str(e)})
                print()
                if idx < total:
                    time.sleep(args.delay)
                continue

            if prediction_data:
                print("OK")
                print(f"    Winner    : {prediction_data['predicted_winner_alliance']} ({prediction_data['predicted_winner_party']})")
                print(f"    Confidence: {prediction_data['confidence_level']} ({float(prediction_data['win_probability']):.0%})")
                print(f"    Vote share: {prediction_data['predicted_vote_share']:.1f}%  Margin: {prediction_data['predicted_margin_pct']:.1f}%")

                if save_prediction(db, prediction_data, version):
                    print(f"    Saved (version {version})")
                    successful += 1
                else:
                    failed += 1
                    failed_list.append({"id": constituency.id, "name": constituency.name, "reason": "DB save failed"})
            else:
                print("FAILED")
                failed += 1
                failed_list.append({"id": constituency.id, "name": constituency.name, "reason": "No prediction returned"})

            print()

            if idx < total:
                time.sleep(args.delay)

        duration = datetime.now() - start_time

        print("=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"Version     : {version}")
        print(f"Successful  : {successful}/{total}")
        print(f"Failed      : {failed}")
        print(f"Time taken  : {duration}")

        if failed_list:
            failed_ids = ",".join(str(f["id"]) for f in failed_list)
            print()
            print("Retry failures:")
            print(f"  poetry run python scripts/v3_batch_predictions.py --constituency-ids {failed_ids}")

        print()
        print("Done!")

    finally:
        db.close()


if __name__ == "__main__":
    main()
