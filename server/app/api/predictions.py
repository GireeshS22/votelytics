"""
API endpoints for election predictions
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Text
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.prediction import Prediction
from app.models.constituency import Constituency
from app.models.election import ElectionResult

router = APIRouter()


def get_latest_version(db: Session, year: int) -> int:
    """Get the latest prediction version for a given year"""
    max_version = db.query(func.max(Prediction.version)).filter(
        Prediction.predicted_year == year
    ).scalar()
    return max_version or 1


def reclassify_confidence_level(win_probability: float, margin_pct: float) -> str:
    """
    Reclassify confidence level based on relaxed thresholds.
    Uses existing win_probability and margin_pct from database.

    Thresholds:
    - Safe: >60% probability AND >8% margin
    - Likely: 52-60% probability AND 5.5-8% margin
    - Lean: 43-52% probability AND 1.25-5.5% margin
    - Toss-up: <43% probability OR <1.25% margin
    """
    if win_probability > 0.60 and margin_pct > 8.0:
        return "Safe"
    elif win_probability > 0.52 and margin_pct > 5.5:
        return "Likely"
    elif win_probability > 0.43 and margin_pct > 1.25:
        return "Lean"
    else:
        return "Toss-up"


@router.get("/summary")
async def get_predictions_summary(
    year: int = Query(default=2026, description="Election year"),
    version: Optional[int] = Query(default=None, description="Prediction version (latest if not specified)"),
    db: Session = Depends(get_db)
):
    """
    Get summary of predictions by alliance and confidence level
    Used for bar chart and summary cards
    """
    # Get version (latest if not specified)
    pred_version = version if version is not None else get_latest_version(db, year)

    # Get all predictions for the year and version
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
    # Get version (latest if not specified)
    pred_version = version if version is not None else get_latest_version(db, year)

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
    # Get alliance from extra_data
    alliance = prediction.extra_data.get('predicted_winner_alliance') if prediction.extra_data else prediction.predicted_winner_party
    top_alliances = prediction.extra_data.get('top_alliances', []) if prediction.extra_data else []

    # Reclassify confidence based on relaxed thresholds
    reclassified_confidence = reclassify_confidence_level(prediction.win_probability, prediction.predicted_margin_pct)

    # If toss-up, show as "Toss-up" instead of alliance
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
        "confidence_level": reclassified_confidence,
        "win_probability": prediction.win_probability,
        "predicted_vote_share": prediction.predicted_vote_share,
        "predicted_margin_pct": prediction.predicted_margin_pct,
        "top_alliances": top_alliances,
        "swing_from_last_election": prediction.swing_from_last_election,
        "key_factors": prediction.key_factors,
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
    year: int = Query(default=2026),
    version: Optional[int] = Query(default=None, description="Prediction version (latest if not specified)"),
    db: Session = Depends(get_db)
):
    """
    Get predictions summary by region
    """
    # Get version (latest if not specified)
    pred_version = version if version is not None else get_latest_version(db, year)

    # Get all predictions with constituencies
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
