"""
API endpoints for election predictions
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Text
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.prediction import Prediction
from app.models.constituency import Constituency
from app.models.election import ElectionResult
from app.models.candidate import Candidate
from app.cache import get_or_compute

# Predictions for a (year, version) pair never change — cache for 24h.
# We always resolve "latest version" first and key by the resolved int.
_PRED_TTL = 86400

router = APIRouter()


def get_latest_version(db: Session, year: int) -> int:
    """Get the latest prediction version for a given year"""
    max_version = db.query(func.max(Prediction.version)).filter(
        Prediction.predicted_year == year
    ).scalar()
    return max_version or 1


def reclassify_confidence_level(win_probability: float, margin_pct: float) -> str:
    """
    Classify confidence level from win_probability and margin_pct.

    Thresholds (calibrated for ~20 Toss-up seats across 234 TN constituencies):
    - Safe    : >= 65% probability AND >= 10% margin
    - Likely  : >= 55% probability AND >= 7% margin
    - Lean    : everything else with a clear winner
    - Toss-up : < 50% probability AND < 2.5% margin (genuinely too close to call)
    """
    if win_probability < 0.50 and margin_pct < 2.5:
        return "Toss-up"
    elif win_probability >= 0.65 and margin_pct >= 10.0:
        return "Safe"
    elif win_probability >= 0.55 and margin_pct >= 7.0:
        return "Likely"
    else:
        return "Lean"


@router.get("/summary")
async def get_predictions_summary(
    response: Response,
    year: int = Query(default=2026, description="Election year"),
    version: Optional[int] = Query(default=None, description="Prediction version (latest if not specified)"),
    db: Session = Depends(get_db)
):
    """
    Get summary of predictions by alliance and confidence level
    Used for bar chart and summary cards
    """
    pred_version = version if version is not None else get_latest_version(db, year)
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"
    return get_or_compute(
        f"predictions-summary:{year}:{pred_version}",
        _PRED_TTL,
        lambda: _compute_predictions_summary(db, year, pred_version),
    )


def _compute_predictions_summary(db: Session, year: int, pred_version: int) -> dict:
    predictions = db.query(Prediction).filter(
        Prediction.predicted_year == year,
        Prediction.version == pred_version
    ).all()

    if not predictions:
        raise HTTPException(status_code=404, detail=f"No predictions found for year {year}")

    # Calculate total seats
    total_seats = 234
    predictions_complete = len(predictions)
    predictions_pending = total_seats - predictions_complete

    # Initialize seat distribution
    seat_distribution = {}

    # Count seats by alliance and confidence (excluding toss-ups)
    toss_up_count = 0
    for pred in predictions:
        # Get alliance from extra_data
        alliance = pred.extra_data.get('predicted_winner_alliance') if pred.extra_data else pred.predicted_winner_party

        # Reclassify confidence based on relaxed thresholds
        confidence = reclassify_confidence_level(pred.win_probability, pred.predicted_margin_pct)

        # If toss-up, don't assign to any alliance - count separately
        if confidence.lower() == 'toss-up':
            toss_up_count += 1
            continue

        if alliance not in seat_distribution:
            seat_distribution[alliance] = {
                'total': 0,
                'safe': 0,
                'likely': 0,
                'lean': 0
            }

        seat_distribution[alliance]['total'] += 1

        confidence_lower = confidence.lower()
        if confidence_lower == 'safe':
            seat_distribution[alliance]['safe'] += 1
        elif confidence_lower == 'likely':
            seat_distribution[alliance]['likely'] += 1
        elif confidence_lower == 'lean':
            seat_distribution[alliance]['lean'] += 1

    # Determine winner (alliance with most seats)
    winner = None
    max_seats = 0
    for alliance, data in seat_distribution.items():
        if data['total'] > max_seats:
            max_seats = data['total']
            winner = alliance

    winning_margin = max_seats - 117 if max_seats >= 117 else 0

    # Get latest prediction creation date
    latest_pred = max(predictions, key=lambda p: p.created_at)
    generated_date = latest_pred.created_at.isoformat()

    return {
        "total_seats": total_seats,
        "majority_mark": 117,
        "predictions_complete": predictions_complete,
        "predictions_pending": predictions_pending,
        "generated_date": generated_date,
        "seat_distribution": seat_distribution,
        "toss_up": toss_up_count,
        "winner": winner,
        "winning_margin": winning_margin,
        "version": pred_version
    }


@router.get("/")
async def get_all_predictions(
    response: Response,
    year: int = Query(default=2026),
    version: Optional[int] = Query(default=None, description="Prediction version (latest if not specified)"),
    alliance: Optional[str] = Query(default=None),
    confidence_level: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    limit: int = Query(default=234, le=500),
    offset: int = Query(default=0),
    db: Session = Depends(get_db)
):
    """
    Get all predictions with optional filtering
    """
    pred_version = version if version is not None else get_latest_version(db, year)
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"

    cache_key = (
        f"predictions-all:{year}:{pred_version}:{alliance or ''}:"
        f"{confidence_level or ''}:{region or ''}:{district or ''}:{limit}:{offset}"
    )
    return get_or_compute(
        cache_key,
        _PRED_TTL,
        lambda: _compute_all_predictions(
            db, year, pred_version, alliance, confidence_level,
            region, district, limit, offset,
        ),
    )


def _compute_all_predictions(
    db: Session,
    year: int,
    pred_version: int,
    alliance: Optional[str],
    confidence_level: Optional[str],
    region: Optional[str],
    district: Optional[str],
    limit: int,
    offset: int,
) -> dict:
    # Base query joining with constituencies
    query = db.query(
        Prediction,
        Constituency.name.label('constituency_name'),
        Constituency.ac_number,
        Constituency.district,
        Constituency.region
    ).join(
        Constituency,
        Prediction.constituency_id == Constituency.id
    ).filter(
        Prediction.predicted_year == year,
        Prediction.version == pred_version
    )

    # Apply SQL filters (except alliance and confidence_level which need reclassification)
    if region:
        query = query.filter(Constituency.region == region)

    if district:
        query = query.filter(Constituency.district == district)

    # Get all results
    results = query.order_by(Constituency.ac_number).all()

    # Format and filter in Python
    predictions = []
    for pred, name, ac_num, dist, reg in results:
        alliance_val = pred.extra_data.get('predicted_winner_alliance') if pred.extra_data else pred.predicted_winner_party

        # Reclassify confidence based on relaxed thresholds
        reclassified_confidence = reclassify_confidence_level(pred.win_probability, pred.predicted_margin_pct)

        # If toss-up, show as "Toss-up" instead of alliance
        if reclassified_confidence.lower() == 'toss-up':
            alliance_val = 'Toss-up'

        # Filter by alliance if specified
        if alliance and alliance_val != alliance:
            continue

        # Filter by confidence_level if specified (after reclassification)
        if confidence_level and reclassified_confidence != confidence_level:
            continue

        # Parse key_factors from string to array
        key_factors_array = []
        if pred.key_factors:
            # Split by sentence endings and clean up
            factors = pred.key_factors.replace('\n', ' ').split('. ')
            key_factors_array = [f.strip() + ('.' if not f.strip().endswith('.') else '') for f in factors if f.strip()]

        predictions.append({
            "id": pred.id,
            "constituency_id": pred.constituency_id,
            "constituency_name": name,
            "ac_number": ac_num,
            "district": dist,
            "region": reg,
            "predicted_winner_alliance": alliance_val,
            "predicted_winner_party": pred.predicted_winner_party if reclassified_confidence.lower() != 'toss-up' else 'Toss-up',
            "confidence_level": reclassified_confidence,
            "win_probability": pred.win_probability,
            "predicted_vote_share": pred.predicted_vote_share,
            "predicted_margin_pct": pred.predicted_margin_pct,
            "key_factors": key_factors_array,
            "version": pred.version,
            "created_at": pred.created_at.isoformat()
        })

    # Apply pagination
    total = len(predictions)
    predictions = predictions[offset:offset + limit]

    return {
        "total": total,
        "version": pred_version,
        "predictions": predictions
    }


def format_prediction_response(prediction: Prediction, constituency: Constituency) -> dict:
    """Helper to format a prediction into API response format"""
    extra = prediction.extra_data or {}

    # Alliance — prefer extra_data for v3+
    alliance = extra.get('predicted_winner_alliance') or prediction.predicted_winner_party

    # top_alliances — V4 stores in top_candidates with {alliance, party, candidate, vote_share}
    # V1-V3 stored top_candidates as {party, vote_share} (no alliance key) — use extra_data instead
    top_candidates = prediction.top_candidates or []
    if top_candidates and any('alliance' in item for item in top_candidates):
        top_alliances = top_candidates  # V4: has proper alliance key
    else:
        top_alliances = extra.get('top_alliances', [])  # V1-V3: proper {alliance, vote_share} structure

    # Reclassify confidence based on relaxed thresholds
    reclassified_confidence = reclassify_confidence_level(prediction.win_probability, prediction.predicted_margin_pct)

    if reclassified_confidence.lower() == 'toss-up':
        alliance = 'Toss-up'
        party = 'Toss-up'
    else:
        party = prediction.predicted_winner_party

    return {
        "id": prediction.id,
        "constituency_id": prediction.constituency_id,
        "constituency": {
            "name": constituency.name,
            "ac_number": constituency.ac_number,
            "district": constituency.district,
            "region": constituency.region,
            "population": constituency.population,
            "urban_pct": constituency.urban_population_pct,
            "literacy_rate": constituency.literacy_rate
        },
        "predicted_winner_alliance": alliance,
        "predicted_winner_party": party,
        "predicted_winner_name": prediction.predicted_winner_name,
        "confidence_level": reclassified_confidence,
        "win_probability": prediction.win_probability,
        "predicted_vote_share": prediction.predicted_vote_share,
        "predicted_margin_pct": prediction.predicted_margin_pct,
        "top_alliances": top_alliances,
        "swing_from_last_election": prediction.swing_from_last_election,
        "key_factors": prediction.key_factors,
        "candidate_factor": extra.get('candidate_factor'),
        "visualization_tags": extra.get('visualization_tags', []),
        "version": prediction.version,
        "created_at": prediction.created_at.isoformat()
    }


@router.get("/constituency/{constituency_id}")
async def get_constituency_prediction(
    constituency_id: int,
    year: int = Query(default=2026),
    version: Optional[int] = Query(default=None, description="Prediction version (latest if not specified)"),
    include_previous: bool = Query(default=False, description="Include previous version for comparison"),
    db: Session = Depends(get_db)
):
    """
    Get detailed prediction for a specific constituency.
    Optionally include previous version for trend comparison.
    """
    # Get version (latest if not specified)
    pred_version = version if version is not None else get_latest_version(db, year)

    # Get prediction
    prediction = db.query(Prediction).filter(
        Prediction.constituency_id == constituency_id,
        Prediction.predicted_year == year,
        Prediction.version == pred_version
    ).first()

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail=f"No prediction found for constituency {constituency_id} in {year}"
        )

    # Get constituency details
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()

    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    # Format main prediction
    response = {
        "prediction": format_prediction_response(prediction, constituency)
    }

    # Include previous version if requested
    if include_previous and pred_version > 1:
        previous_prediction = db.query(Prediction).filter(
            Prediction.constituency_id == constituency_id,
            Prediction.predicted_year == year,
            Prediction.version == pred_version - 1
        ).first()

        if previous_prediction:
            response["previous_prediction"] = format_prediction_response(previous_prediction, constituency)
        else:
            response["previous_prediction"] = None
    elif include_previous:
        response["previous_prediction"] = None

    return response


@router.get("/regional-summary")
async def get_regional_summary(
    response: Response,
    year: int = Query(default=2026),
    version: Optional[int] = Query(default=None, description="Prediction version (latest if not specified)"),
    db: Session = Depends(get_db)
):
    """
    Get predictions summary by region
    """
    pred_version = version if version is not None else get_latest_version(db, year)
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"
    return get_or_compute(
        f"predictions-regional:{year}:{pred_version}",
        _PRED_TTL,
        lambda: _compute_regional_summary(db, year, pred_version),
    )


def _compute_regional_summary(db: Session, year: int, pred_version: int) -> dict:
    predictions = db.query(
        Prediction,
        Constituency.region
    ).join(
        Constituency,
        Prediction.constituency_id == Constituency.id
    ).filter(
        Prediction.predicted_year == year,
        Prediction.version == pred_version
    ).all()

    # Structure data by region
    regions = {}

    for pred, region in predictions:
        if not region:
            region = "Unknown"

        if region not in regions:
            regions[region] = {"total": 0}

        # Get alliance from extra_data
        alliance = pred.extra_data.get('predicted_winner_alliance') if pred.extra_data else pred.predicted_winner_party
        alliance_name = alliance if alliance else "Others"

        if alliance_name not in regions[region]:
            regions[region][alliance_name] = 0

        regions[region][alliance_name] += 1
        regions[region]["total"] += 1

    return {
        "regions": regions,
        "version": pred_version
    }


@router.get("/comparison")
async def get_prediction_comparison(
    from_year: int = Query(default=2021),
    to_year: int = Query(default=2026),
    db: Session = Depends(get_db)
):
    """
    Compare predictions with historical results
    """
    # Get historical results for from_year
    historical_results = db.query(
        ElectionResult.party,
        func.count(ElectionResult.id).label('seats')
    ).filter(
        ElectionResult.year == from_year,
        ElectionResult.is_winner == 1
    ).group_by(ElectionResult.party).all()

    # Get predictions for to_year
    predictions = db.query(Prediction).filter(
        Prediction.predicted_year == to_year
    ).all()

    # Map parties to alliances for historical data
    # Simplified mapping - should use the same logic as prediction generation
    historical_alliances = {}
    for party, seats in historical_results:
        # Simple alliance mapping
        if 'DMK' in party.upper() and 'AIADMK' not in party.upper():
            alliance = 'DMK+'
        elif 'AIADMK' in party.upper() or 'ADMK' in party.upper():
            alliance = 'AIADMK+'
        elif 'CONGRESS' in party.upper() or party.upper() == 'INC':
            alliance = 'DMK+'
        elif 'BJP' in party.upper():
            alliance = 'AIADMK+'
        elif 'VCK' in party.upper():
            alliance = 'DMK+'
        elif 'NTK' in party.upper():
            alliance = 'NTK'
        else:
            alliance = 'Others'

        if alliance not in historical_alliances:
            historical_alliances[alliance] = 0
        historical_alliances[alliance] += seats

    # Count predictions by alliance
    predicted_alliances = {}
    for pred in predictions:
        alliance = pred.extra_data.get('predicted_winner_alliance') if pred.extra_data else pred.predicted_winner_party
        if alliance not in predicted_alliances:
            predicted_alliances[alliance] = 0
        predicted_alliances[alliance] += 1

    # Build comparison
    comparison = {}
    all_alliances = set(list(historical_alliances.keys()) + list(predicted_alliances.keys()))

    for alliance in all_alliances:
        hist_seats = historical_alliances.get(alliance, 0)
        pred_seats = predicted_alliances.get(alliance, 0)
        swing = pred_seats - hist_seats

        comparison[alliance] = {
            str(from_year): hist_seats,
            str(to_year): pred_seats,
            "swing": swing
        }

    return {
        "from_year": from_year,
        "to_year": to_year,
        "comparison": comparison
    }


@router.get("/versions")
async def get_available_versions(
    year: int = Query(default=2026, description="Election year"),
    db: Session = Depends(get_db)
):
    """
    Get list of available prediction versions for a year
    """
    # Get distinct versions with their creation dates
    versions = db.query(
        Prediction.version,
        func.min(Prediction.created_at).label('created_at'),
        func.count(Prediction.id).label('count')
    ).filter(
        Prediction.predicted_year == year
    ).group_by(
        Prediction.version
    ).order_by(
        Prediction.version.desc()
    ).all()

    return {
        "year": year,
        "versions": [
            {
                "version": v.version,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "prediction_count": v.count
            }
            for v in versions
        ],
        "latest_version": versions[0].version if versions else None
    }


@router.get("/article-data")
async def get_article_data(
    response: Response,
    year: int = Query(default=2026),
    db: Session = Depends(get_db)
):
    """
    Aggregated data for the prediction analysis article page.
    Returns everything needed in one call.
    """
    pred_version = get_latest_version(db, year)
    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"
    return get_or_compute(
        f"predictions-article:{year}:{pred_version}",
        _PRED_TTL,
        lambda: _compute_article_data(db, year, pred_version),
    )


def _compute_article_data(db: Session, year: int, pred_version: int) -> dict:
    # Load all predictions with constituency info
    rows = (
        db.query(Prediction, Constituency)
        .join(Constituency, Prediction.constituency_id == Constituency.id)
        .filter(Prediction.predicted_year == year, Prediction.version == pred_version)
        .order_by(Constituency.ac_number)
        .all()
    )

    if not rows:
        raise HTTPException(status_code=404, detail="No predictions found")

    # Load all candidates for this year
    candidates = db.query(Candidate).filter(
        Candidate.extra_data["election_year"].as_integer() == year
    ).all()

    # Build candidate map: constituency_id -> {alliance: {name, party}}
    cand_map = {}
    for c in candidates:
        if c.constituency_id not in cand_map:
            cand_map[c.constituency_id] = {}
        cand_map[c.constituency_id][c.alliance] = {
            "name": c.name, "party": c.party
        }

    def get_alliance(pred):
        a = (pred.extra_data or {}).get('predicted_winner_alliance') or pred.predicted_winner_party
        return a

    def get_top_alliances(pred):
        tc = pred.top_candidates or []
        if tc and any('alliance' in item for item in tc):
            return tc
        extra = pred.extra_data or {}
        return extra.get('top_alliances', [])

    def reclassify(pred):
        return reclassify_confidence_level(pred.win_probability, pred.predicted_margin_pct)

    # ── Build per-constituency records ──
    all_records = []
    seat_counts = {}           # alliance -> {safe, likely, lean, tossup, total}
    district_breakdown = {}    # district -> {alliance -> count}
    alliance_vote_totals = {}  # alliance -> [vote_shares]
    party_vote_totals = {}     # party -> [vote_shares]
    tossup_seats = []
    tvk_seats = []
    bjp_seats = []

    for pred, const in rows:
        alliance = get_alliance(pred)
        conf = reclassify(pred)
        top_a = get_top_alliances(pred)
        const_candidates = cand_map.get(pred.constituency_id, {})

        record = {
            "ac_number": const.ac_number,
            "name": const.name,
            "district": const.district,
            "alliance": alliance,
            "confidence": conf,
            "win_probability": pred.win_probability,
            "predicted_vote_share": pred.predicted_vote_share,
            "predicted_margin_pct": pred.predicted_margin_pct,
            "key_factors": pred.key_factors,
            "top_alliances": top_a,
            "candidates": const_candidates,
        }
        all_records.append(record)

        # Seat counts
        if alliance not in seat_counts:
            seat_counts[alliance] = {"safe": 0, "likely": 0, "lean": 0, "tossup": 0, "total": 0}
        seat_counts[alliance]["total"] += 1
        seat_counts[alliance][conf.lower().replace("-", "")] += 1

        # District breakdown
        dist = const.district or "Unknown"
        if dist not in district_breakdown:
            district_breakdown[dist] = {}
        district_breakdown[dist][alliance] = district_breakdown[dist].get(alliance, 0) + 1

        # Alliance vote totals (from top_alliances)
        for a in top_a:
            aname = a.get("alliance") or a.get("party", "Unknown")
            vs = a.get("vote_share", 0)
            if aname not in alliance_vote_totals:
                alliance_vote_totals[aname] = []
            alliance_vote_totals[aname].append(vs)

            # Party-level breakdown
            party = a.get("party", aname)
            if party not in party_vote_totals:
                party_vote_totals[party] = {"vote_shares": [], "alliance": aname}
            party_vote_totals[party]["vote_shares"].append(vs)

        # Toss-up seats
        if conf == "Toss-up":
            tossup_seats.append(record)

        # TVK data
        tvk_entry = next((a for a in top_a if (a.get("alliance") or a.get("party", "")) == "TVK"), None)
        if tvk_entry:
            tvk_seats.append({
                **record,
                "tvk_vote_share": tvk_entry.get("vote_share", 0),
            })

        # BJP seats: where the NDA candidate's party is BJP
        nda_cand = const_candidates.get("NDA", const_candidates.get("AIADMK+", {}))
        if nda_cand and nda_cand.get("party") == "BJP":
            bjp_seats.append(record)

    # ── Compute aggregate stats ──

    # Average vote share per alliance
    avg_vote_shares = {}
    for aname, shares in alliance_vote_totals.items():
        avg_vote_shares[aname] = round(sum(shares) / len(shares), 2) if shares else 0

    # Party-level averages
    party_averages = {}
    for party, data in party_vote_totals.items():
        avg = round(sum(data["vote_shares"]) / len(data["vote_shares"]), 2) if data["vote_shares"] else 0
        party_averages[party] = {"avg_vote_share": avg, "alliance": data["alliance"], "seats_contested": len(data["vote_shares"])}

    # Top 10 TVK seats by vote share
    tvk_top_10 = sorted(tvk_seats, key=lambda x: x["tvk_vote_share"], reverse=True)[:10]

    # BJP vs INC and BJP vs DMK head-to-head
    bjp_vs_inc = []
    bjp_vs_dmk = []
    for rec in all_records:
        ta = rec["top_alliances"]
        cands = rec["candidates"]
        nda_cand = cands.get("NDA", cands.get("AIADMK+", {}))
        spa_cand = cands.get("SPA", cands.get("DMK+", {}))
        nda_party = nda_cand.get("party", "")
        spa_party = spa_cand.get("party", "")

        spa_share = next((a.get("vote_share", 0) for a in ta if (a.get("alliance") or a.get("party")) == "SPA"), 0)
        nda_share = next((a.get("vote_share", 0) for a in ta if (a.get("alliance") or a.get("party")) == "NDA"), 0)

        if nda_party == "BJP" and spa_party == "INC":
            bjp_vs_inc.append({
                "ac_number": rec["ac_number"], "name": rec["name"], "district": rec["district"],
                "bjp_candidate": nda_cand.get("name"), "inc_candidate": spa_cand.get("name"),
                "bjp_share": nda_share, "inc_share": spa_share,
                "winner": rec["alliance"], "margin": rec["predicted_margin_pct"],
            })
        if nda_party == "BJP":
            bjp_vs_dmk.append({
                "ac_number": rec["ac_number"], "name": rec["name"], "district": rec["district"],
                "bjp_candidate": nda_cand.get("name"), "dmk_candidate": spa_cand.get("name"),
                "spa_party": spa_party,
                "bjp_share": nda_share, "dmk_share": spa_share,
                "winner": rec["alliance"], "margin": rec["predicted_margin_pct"],
            })

    # DMK vs AIADMK head-to-head margins
    dmk_vs_admk = []
    for rec in all_records:
        ta = rec["top_alliances"]
        spa_share = next((a.get("vote_share", 0) for a in ta if (a.get("alliance") or a.get("party")) == "SPA"), 0)
        nda_share = next((a.get("vote_share", 0) for a in ta if (a.get("alliance") or a.get("party")) == "NDA"), 0)
        dmk_vs_admk.append({
            "ac_number": rec["ac_number"], "name": rec["name"], "district": rec["district"],
            "dmk_share": spa_share, "admk_share": nda_share,
            "diff": round(spa_share - nda_share, 2),
            "winner": rec["alliance"], "confidence": rec["confidence"],
        })

    # Margin distribution buckets
    margin_buckets = {"<2%": 0, "2-5%": 0, "5-10%": 0, "10-20%": 0, ">20%": 0}
    for rec in all_records:
        m = abs(rec["predicted_margin_pct"])
        if m < 2: margin_buckets["<2%"] += 1
        elif m < 5: margin_buckets["2-5%"] += 1
        elif m < 10: margin_buckets["5-10%"] += 1
        elif m < 20: margin_buckets["10-20%"] += 1
        else: margin_buckets[">20%"] += 1

    return {
        "year": year,
        "version": pred_version,
        "total_seats": len(rows),
        "generated_date": rows[0][0].created_at.isoformat() if rows else None,
        "seat_counts": seat_counts,
        "district_breakdown": district_breakdown,
        "avg_vote_shares": avg_vote_shares,
        "party_averages": party_averages,
        "margin_buckets": margin_buckets,
        "tossup_seats": tossup_seats,
        "tvk_top_10": tvk_top_10,
        "bjp_seats": bjp_seats,
        "bjp_vs_inc": bjp_vs_inc,
        "bjp_vs_dmk": bjp_vs_dmk,
        "dmk_vs_admk": sorted(dmk_vs_admk, key=lambda x: x["diff"]),
        "all_predictions": all_records,
    }
