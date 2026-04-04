"""
V4 Batch Prediction Pipeline — GPT-5.4 + OpenAI Batch API
==========================================================
Generates 2026 election predictions for Tamil Nadu constituencies
using GPT-5.4 with high reasoning via the OpenAI Batch API.

Incremental: already-predicted constituencies are skipped automatically.
Batch job IDs are stored in data/v4_batch_jobs.json for later retrieval.

Usage:
    # Submit a batch (incremental — skips already predicted)
    poetry run python scripts/v4_batch_predictions.py --submit
    poetry run python scripts/v4_batch_predictions.py --submit --sample 10
    poetry run python scripts/v4_batch_predictions.py --submit --sample 25  # only runs 11-25

    # Check status of all submitted batches
    poetry run python scripts/v4_batch_predictions.py --status

    # Fetch completed results and save to DB
    poetry run python scripts/v4_batch_predictions.py --fetch

    # Submit then auto-poll until done (for small batches)
    poetry run python scripts/v4_batch_predictions.py --submit --sample 10 --wait
"""

import sys
import os
import json
import time
import argparse
import re
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.candidate import Candidate
from app.models.prediction import Prediction
from app.models.election import ElectionResult
from app.config import settings
from app.services.prediction_generator import (
    load_alliance_config,
    fetch_constituency_historical_data,
    map_party_to_alliance,
)

# ── Constants ──────────────────────────────────────────────────────────────────

VERSION       = 4
YEAR          = 2026
MODEL         = "gpt-5.4"
ELECTION_YEAR = 2026

_BASE           = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALLIANCE_CONFIG = os.path.join(_BASE, "data", "alliance_config_2026.json")
BATCH_JOBS_FILE = os.path.join(_BASE, "data", "v4_batch_jobs.json")

SYSTEM_PROMPT = (
    "You are an impartial, data-driven election analyst with no political affiliation "
    "or bias toward any party, leader, or ideology. Your only goal is to provide "
    "objective, evidence-based analysis.\n\n"
    "For the upcoming Tamil Nadu Legislative Assembly election, analyze the supplied "
    "constituency data and predict the most likely outcome based solely on the "
    "information provided. Consider:\n"
    "- Historical vote shares and margins (2011, 2016, 2021)\n"
    "- Whether the incumbent candidate is re-contesting\n"
    "- Candidate quality and party strength at the local level\n"
    "- Four-way vote split dynamics (SPA, NDA, TVK, NTK)\n"
    "- Observable patterns in the data — do not assume any alliance has a structural advantage\n\n"
    "You must be equally willing to predict any of the four alliances as the winner. "
    "Never favour an alliance simply because they are the incumbent or opposition."
)


# ── Prompt builder ─────────────────────────────────────────────────────────────

def build_v4_prompt(constituency_data: dict, candidates: dict) -> str:
    """
    Pure data prompt — no political framing or incumbency bias.
    System prompt handles the analyst persona and neutrality instructions.
    """
    const = constituency_data["constituency"]
    hist  = constituency_data["historical_results"]

    lines = []
    lines.append("=== CONSTITUENCY DATA ===")
    lines.append(f"Name: {const['name']} (AC #{const['ac_number']})")
    region = const.get('region')
    location = f"District: {const['district']}"
    if region and region.lower() not in ('unknown', 'none', ''):
        location += f" | Region: {region}"
    lines.append(location)

    if const.get("population"):
        lines.append(
            f"Demographics: Population {const['population']:,} | "
            f"Urban {const.get('urban_pct') or 0:.1f}% | "
            f"Literacy {const.get('literacy_rate') or 0:.1f}%"
        )

    lines.append("\n=== HISTORICAL ELECTION RESULTS ===")
    for year in [2021, 2016, 2011]:
        if year not in hist:
            continue
        d = hist[year]
        lines.append(f"\n{year}:")
        winner_candidate = d['top_candidates'][0]['name'] if d.get('top_candidates') else ''
        winner_str = f"{winner_candidate} ({d['winner']}, {d['winner_alliance']})" if winner_candidate else f"{d['winner']} ({d['winner_alliance']})"
        lines.append(f"  Winner: {winner_str} — {d['winner_vote_share']:.1f}% | Margin: {d['margin_pct']:.1f}%")
        for alliance, share in list(d["alliance_shares"].items())[:5]:
            lines.append(f"  {alliance}: {share['vote_share']:.1f}%")

    lines.append("\n=== 2026 CANDIDATES ===")
    for alliance in ["SPA", "NDA", "TVK", "NTK"]:
        c = candidates.get(alliance)
        if c:
            lines.append(f"  {alliance}: {c['name']} ({c['party']})")
        else:
            lines.append(f"  {alliance}: TBD")

    lines.append("\n=== 2026 ELECTION STRUCTURE ===")
    lines.append("  - Four alliances contesting: SPA (DMK-led), NDA (AIADMK-led), TVK (Vijay — first election), NTK (Seeman — all 234 seats)")
    lines.append("  - Vote split across four alliances is a key variable in every constituency")
    lines.append("  - Candidate incumbency: check if 2021 winner is re-contesting above")

    lines.append("""
=== TASK ===
Based solely on the data above, reason through the following steps before predicting:

Step 1 — Key Objective Factors:
  • Incumbency: is the 2021 winning candidate re-contesting in 2026?
  • Party continuity / change across 2011, 2016, 2021
  • Historical swing patterns and margin trends
  • Any observable data patterns (e.g., dominant alliance, consistent margins, major party switches)

Step 2 — Analysis & Reasoning:
  Strictly based on provided data only. Factual and neutral. Consider the four-way vote split (SPA/NDA/TVK/NTK) and how it affects the outcome.

Step 3 — Most Likely Outcome:
  State the predicted winner with a short justification. Use phrases like:
  "Strongly favoured", "Highly competitive", "Advantage to X due to incumbency",
  "Too close to call", "NDA benefits from anti-incumbency split"
  Never declare a certain win unless the data makes it obvious.

After completing the above reasoning, output ONLY valid JSON (no markdown, no extra text):

{
  "predicted_winner_alliance": "<SPA|NDA|TVK|NTK>",
  "predicted_winner_party": "<party name>",
  "predicted_winner_candidate": "<candidate name>",
  "confidence_level": "<Safe|Likely|Lean|Toss-up>",
  "win_probability": 0.00,
  "predicted_vote_share": 0.0,
  "predicted_margin_pct": 0.0,
  "top_alliances": [
    {"alliance": "SPA",  "party": "<party>", "candidate": "<name>", "vote_share": 0.0},
    {"alliance": "NDA",  "party": "<party>", "candidate": "<name>", "vote_share": 0.0},
    {"alliance": "TVK",  "party": "TVK",     "candidate": "<name>", "vote_share": 0.0},
    {"alliance": "NTK",  "party": "NTK",     "candidate": "<name>", "vote_share": 0.0}
  ],
  "candidate_factor": "<positive|neutral|negative>",
  "swing_from_2021": 0.0,
  "key_factors": "<your Step 2 analysis as a detailed multi-sentence paragraph>",
  "visualization_tags": ["<tag1>", "<tag2>"]
}

confidence_level: Safe = near-certain, Likely = strong advantage, Lean = slight edge, Toss-up = too close to call
candidate_factor: impact of the specific candidate vs alliance baseline (positive/neutral/negative)
visualization_tags — pick all that apply: [safe_seat, marginal, toss_up, urban, rural, semi_urban,
  incumbent_advantage, anti_incumbency, star_candidate, weak_candidate, caste_factor,
  minority_factor, youth_vote, split_vote, tvk_factor, nda_consolidation]
""")

    return "\n".join(lines)


# ── Candidate loader ───────────────────────────────────────────────────────────

def load_candidates_for_constituency(constituency_id: int, db: Session) -> dict:
    """Returns {alliance: {name, party}} for all 4 alliances."""
    rows = (
        db.query(Candidate)
        .filter(
            Candidate.constituency_id == constituency_id,
            Candidate.extra_data["election_year"].as_integer() == ELECTION_YEAR,
        )
        .all()
    )
    result = {}
    for row in rows:
        result[row.alliance] = {"name": row.name, "party": row.party}
    return result


# ── Already-predicted check ────────────────────────────────────────────────────

def get_already_predicted_ids(db: Session) -> set:
    """Return constituency IDs that already have a v4 prediction."""
    rows = (
        db.query(Prediction.constituency_id)
        .filter(
            Prediction.predicted_year == YEAR,
            Prediction.version == VERSION,
        )
        .all()
    )
    return {r.constituency_id for r in rows}


# ── Batch job tracking ─────────────────────────────────────────────────────────

def load_batch_jobs() -> list:
    if os.path.exists(BATCH_JOBS_FILE):
        with open(BATCH_JOBS_FILE) as f:
            return json.load(f)
    return []


def save_batch_job(batch_id: str, constituency_ids: list, total: int):
    jobs = load_batch_jobs()
    jobs.append({
        "batch_id":        batch_id,
        "submitted_at":    datetime.utcnow().isoformat(),
        "constituency_ids": constituency_ids,
        "total":           total,
        "status":          "submitted",
        "fetched":         False,
    })
    os.makedirs(os.path.dirname(BATCH_JOBS_FILE), exist_ok=True)
    with open(BATCH_JOBS_FILE, "w") as f:
        json.dump(jobs, f, indent=2)
    print(f"  Batch job saved: {batch_id}")


def mark_batch_fetched(batch_id: str):
    jobs = load_batch_jobs()
    for job in jobs:
        if job["batch_id"] == batch_id:
            job["fetched"] = True
            job["status"]  = "fetched"
    with open(BATCH_JOBS_FILE, "w") as f:
        json.dump(jobs, f, indent=2)


# ── Submit ─────────────────────────────────────────────────────────────────────

def submit_batch(sample: int | None, db: Session, client: OpenAI):
    alliance_config = load_alliance_config(ALLIANCE_CONFIG)
    already_done    = get_already_predicted_ids(db)

    # Get constituencies ordered by AC number
    query = db.query(Constituency).order_by(Constituency.ac_number)
    if sample:
        query = query.limit(sample)
    constituencies = query.all()

    # Filter out already predicted
    to_predict = [c for c in constituencies if c.id not in already_done]

    if not to_predict:
        print(f"All {len(constituencies)} constituencies already predicted at v{VERSION}. Nothing to do.")
        return

    print(f"Constituencies in scope:   {len(constituencies)}")
    print(f"Already predicted (v{VERSION}):  {len(already_done & {c.id for c in constituencies})}")
    print(f"To predict now:            {len(to_predict)}")

    # Build JSONL
    jsonl_lines = []
    constituency_ids = []

    for c in to_predict:
        const_data = fetch_constituency_historical_data(
            constituency_id=c.id,
            db=db,
            alliance_mapping=alliance_config["party_mapping"],
        )
        if not const_data:
            print(f"  [WARN] No data for {c.name} — skipping")
            continue

        candidates = load_candidates_for_constituency(c.id, db)
        prompt     = build_v4_prompt(const_data, candidates)

        request = {
            "custom_id": f"ac-{c.ac_number:03d}-id-{c.id}",
            "method":    "POST",
            "url":       "/v1/responses",
            "body": {
                "model":     MODEL,
                "reasoning": {"effort": "high"},
                "input": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt}
                ],
            },
        }
        jsonl_lines.append(json.dumps(request))
        constituency_ids.append(c.id)

    if not jsonl_lines:
        print("No valid requests to submit.")
        return

    # Write JSONL to temp file
    jsonl_path = os.path.join(_BASE, "data", f"v4_batch_input_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jsonl")
    os.makedirs(os.path.dirname(jsonl_path), exist_ok=True)
    with open(jsonl_path, "w", encoding="utf-8") as f:
        f.write("\n".join(jsonl_lines))

    print(f"\nUploading {len(jsonl_lines)} requests to OpenAI...")
    with open(jsonl_path, "rb") as f:
        uploaded = client.files.create(file=f, purpose="batch")
    print(f"  File uploaded: {uploaded.id}")

    batch = client.batches.create(
        input_file_id    = uploaded.id,
        endpoint         = "/v1/responses",
        completion_window= "24h",
        metadata         = {"description": f"V4 predictions — {len(jsonl_lines)} constituencies"},
    )
    print(f"  Batch created: {batch.id} | Status: {batch.status}")
    save_batch_job(batch.id, constituency_ids, len(jsonl_lines))
    return batch.id


# ── Status ─────────────────────────────────────────────────────────────────────

def check_status(client: OpenAI):
    jobs = load_batch_jobs()
    if not jobs:
        print("No batch jobs found.")
        return

    for job in jobs:
        if job.get("fetched"):
            print(f"  {job['batch_id']} — already fetched ({job['total']} constituencies)")
            continue
        batch = client.batches.retrieve(job["batch_id"])
        counts = batch.request_counts
        print(
            f"  {batch.id} | {batch.status} | "
            f"done={counts.completed}/{counts.total} failed={counts.failed} | "
            f"submitted={job['submitted_at']}"
        )


# ── Fetch & Save ───────────────────────────────────────────────────────────────

def parse_json_from_response(text: str) -> dict | None:
    """Extract JSON from GPT response text (handles reasoning preamble)."""
    text = text.strip()
    # Remove markdown fences
    text = re.sub(r"^```json?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
    # Find first { ... } block
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    return None


def save_prediction_to_db(
    constituency_id: int,
    data: dict,
    db: Session,
):
    """Map GPT JSON output to predictions table columns."""

    # top_candidates column: store full alliance breakdown with candidates
    top_candidates = [
        {
            "alliance":   a.get("alliance"),
            "party":      a.get("party"),
            "candidate":  a.get("candidate"),
            "vote_share": a.get("vote_share"),
        }
        for a in data.get("top_alliances", [])
    ]

    prediction = Prediction(
        version                = VERSION,
        constituency_id        = constituency_id,
        predicted_year         = YEAR,
        predicted_winner_party = data.get("predicted_winner_party", ""),
        predicted_winner_name  = data.get("predicted_winner_candidate"),
        confidence_level       = data.get("confidence_level"),
        win_probability        = data.get("win_probability"),
        predicted_vote_share   = data.get("predicted_vote_share"),
        predicted_margin_pct   = data.get("predicted_margin_pct"),
        top_candidates         = top_candidates,
        swing_from_last_election = data.get("swing_from_2021"),
        key_factors            = data.get("key_factors"),
        prediction_model       = MODEL,
        extra_data             = {
            "predicted_winner_alliance": data.get("predicted_winner_alliance"),
            "candidate_factor":          data.get("candidate_factor"),
            "visualization_tags":        data.get("visualization_tags", []),
            "election_year":             ELECTION_YEAR,
            "raw_gpt_response":          data,  # full raw JSON from GPT
        },
    )
    db.add(prediction)


def fetch_results(db: Session, client: OpenAI):
    jobs = load_batch_jobs()
    pending = [j for j in jobs if not j.get("fetched")]

    if not pending:
        print("No pending batch jobs to fetch.")
        return

    saved_total = 0

    for job in pending:
        batch = client.batches.retrieve(job["batch_id"])
        print(f"\nBatch {batch.id} — status: {batch.status}")

        if batch.status != "completed":
            counts = batch.request_counts
            print(f"  Not ready yet: {counts.completed}/{counts.total} done, {counts.failed} failed")
            continue

        # Download output file
        output_file = client.files.content(batch.output_file_id)
        lines = output_file.text.strip().split("\n")
        print(f"  Downloaded {len(lines)} results")

        saved = 0
        errors = 0

        for line in lines:
            try:
                result = json.loads(line)
                custom_id = result["custom_id"]  # "ac-001-id-5"
                # Extract constituency_id from custom_id
                m = re.search(r"id-(\d+)$", custom_id)
                if not m:
                    print(f"  [WARN] Cannot parse custom_id: {custom_id}")
                    errors += 1
                    continue
                constituency_id = int(m.group(1))

                # Check if already saved (idempotent)
                existing = db.query(Prediction).filter_by(
                    constituency_id=constituency_id,
                    predicted_year=YEAR,
                    version=VERSION,
                ).first()
                if existing:
                    continue

                # Extract response text
                response_body = result.get("response", {}).get("body", {})
                # Responses API output is in output array
                output_items = response_body.get("output", [])
                response_text = ""
                for item in output_items:
                    if item.get("type") == "message":
                        for content in item.get("content", []):
                            if content.get("type") == "output_text":
                                response_text = content.get("text", "")
                                break

                if not response_text:
                    print(f"  [WARN] Empty response for {custom_id}")
                    errors += 1
                    continue

                data = parse_json_from_response(response_text)
                if not data:
                    print(f"  [WARN] JSON parse failed for {custom_id}")
                    errors += 1
                    continue

                save_prediction_to_db(constituency_id, data, db)
                saved += 1

            except Exception as e:
                print(f"  [ERROR] {e}")
                errors += 1

        db.commit()
        mark_batch_fetched(job["batch_id"])
        print(f"  Saved {saved} predictions | Errors: {errors}")
        saved_total += saved

    print(f"\nTotal saved: {saved_total}")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="V4 GPT-5.4 batch predictions")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--submit", action="store_true", help="Build and submit batch")
    group.add_argument("--status", action="store_true", help="Check batch status")
    group.add_argument("--fetch",  action="store_true", help="Fetch results and save to DB")

    parser.add_argument("--sample", type=int, default=None,
                        help="Only process first N constituencies (incremental)")
    parser.add_argument("--wait",   action="store_true",
                        help="After submit, poll until complete then fetch automatically")
    args = parser.parse_args()

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    db     = SessionLocal()

    try:
        if args.submit:
            batch_id = submit_batch(args.sample, db, client)
            if args.wait and batch_id:
                print("\nWaiting for batch to complete (polling every 60s)...")
                while True:
                    batch = client.batches.retrieve(batch_id)
                    counts = batch.request_counts
                    print(f"  [{datetime.utcnow().strftime('%H:%M:%S')}] {batch.status} — {counts.completed}/{counts.total} done")
                    if batch.status == "completed":
                        break
                    if batch.status in ("failed", "expired", "cancelled"):
                        print(f"  Batch ended with status: {batch.status}")
                        return
                    time.sleep(60)
                fetch_results(db, client)

        elif args.status:
            check_status(client)

        elif args.fetch:
            fetch_results(db, client)

    finally:
        db.close()


if __name__ == "__main__":
    main()
