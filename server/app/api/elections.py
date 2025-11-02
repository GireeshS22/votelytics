"""API endpoints for elections and results"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from collections import defaultdict

from app.database import get_db
from app.models.election import Election, ElectionResult
from app.models.constituency import Constituency
from app.schemas.election import (
    ElectionResponse,
    ElectionResultResponse,
    ConstituencyElectionHistory,
)
from app.config import settings
from app.rate_limiters import limiter

router = APIRouter()


@router.get("/", response_model=List[ElectionResponse])
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def get_elections(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    year: Optional[int] = None,
    election_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get list of all elections with optional filters

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **year**: Filter by election year
    - **election_type**: Filter by type (Assembly, Lok Sabha)

    **Rate limit**: 100 requests per minute
    """
    query = db.query(Election)

    # Apply filters
    if year:
        query = query.filter(Election.year == year)
    if election_type:
        query = query.filter(Election.election_type == election_type)

    # Order by year descending (most recent first)
    elections = query.order_by(Election.year.desc()).offset(skip).limit(limit).all()

    return elections


@router.get("/bastion-seats-three-elections")
def get_bastion_seats_three_elections(
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get bastion seats analysis across THREE elections (2011, 2016, 2021)
    - Constituencies held by the same party in all three elections

    This shows true party strongholds that have been consistent for 10 years
    """
    # Get elections for all three years
    election_2011 = db.query(Election).filter(Election.year == 2011).first()
    election_2016 = db.query(Election).filter(Election.year == 2016).first()
    election_2021 = db.query(Election).filter(Election.year == 2021).first()

    if not election_2011:
        raise HTTPException(status_code=404, detail="2011 election not found")
    if not election_2016:
        raise HTTPException(status_code=404, detail="2016 election not found")
    if not election_2021:
        raise HTTPException(status_code=404, detail="2021 election not found")

    # Get winners from all three elections
    winners_2011 = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_2011.id, ElectionResult.is_winner == 1)
        .all()
    )

    winners_2016 = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_2016.id, ElectionResult.is_winner == 1)
        .all()
    )

    winners_2021 = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_2021.id, ElectionResult.is_winner == 1)
        .all()
    )

    # Create mapping of constituency_id to winner
    map_2011 = {w.constituency_id: w for w in winners_2011}
    map_2016 = {w.constituency_id: w for w in winners_2016}
    map_2021 = {w.constituency_id: w for w in winners_2021}

    # Find bastion seats (same party won all three elections)
    bastion_seats = []
    party_bastions = defaultdict(lambda: {'count': 0, 'seats': []})

    # Get constituencies that have data for all three elections
    common_constituencies = set(map_2011.keys()) & set(map_2016.keys()) & set(map_2021.keys())

    for const_id in common_constituencies:
        winner_2011 = map_2011[const_id]
        winner_2016 = map_2016[const_id]
        winner_2021 = map_2021[const_id]

        # Check if same party won all three times
        if winner_2011.party == winner_2016.party == winner_2021.party:
            # Calculate average margin across three elections
            margins = [
                winner_2011.margin or 0,
                winner_2016.margin or 0,
                winner_2021.margin or 0
            ]
            avg_margin = sum(margins) / 3

            margin_pcts = [
                winner_2011.margin_pct or 0,
                winner_2016.margin_pct or 0,
                winner_2021.margin_pct or 0
            ]
            avg_margin_pct = sum(margin_pcts) / 3

            bastion_data = {
                'constituency_id': const_id,
                'constituency_name': winner_2021.ac_name,
                'ac_number': winner_2021.ac_number,
                'party': winner_2021.party,
                'margin_2011': winner_2011.margin,
                'margin_2016': winner_2016.margin,
                'margin_2021': winner_2021.margin,
                'avg_margin': int(avg_margin),
                'margin_pct_2011': winner_2011.margin_pct,
                'margin_pct_2016': winner_2016.margin_pct,
                'margin_pct_2021': winner_2021.margin_pct,
                'avg_margin_pct': round(avg_margin_pct, 2),
                'vote_share_2011': winner_2011.vote_share_pct,
                'vote_share_2016': winner_2016.vote_share_pct,
                'vote_share_2021': winner_2021.vote_share_pct,
                'candidate_2011': winner_2011.candidate_name,
                'candidate_2016': winner_2016.candidate_name,
                'candidate_2021': winner_2021.candidate_name,
                'margin_trend': 'increasing' if margins[2] > margins[1] > margins[0] else
                                'decreasing' if margins[2] < margins[1] < margins[0] else 'mixed',
                'strength': 'strong' if avg_margin > 20000 else 'moderate' if avg_margin > 10000 else 'weak'
            }

            bastion_seats.append(bastion_data)
            party_bastions[winner_2021.party]['count'] += 1
            party_bastions[winner_2021.party]['seats'].append(bastion_data)

    # Sort bastion seats by average margin (strongest first)
    bastion_seats.sort(key=lambda x: x['avg_margin'], reverse=True)

    # Prepare party summary
    party_summary = []
    for party, data in party_bastions.items():
        # Calculate average strength
        total_avg_margin = sum(seat['avg_margin'] for seat in data['seats'])
        avg_party_margin = total_avg_margin / data['count'] if data['count'] > 0 else 0

        party_summary.append({
            'party': party,
            'total_bastions': data['count'],
            'avg_margin': int(avg_party_margin),
            'strong_bastions': sum(1 for seat in data['seats'] if seat['strength'] == 'strong'),
            'moderate_bastions': sum(1 for seat in data['seats'] if seat['strength'] == 'moderate'),
            'weak_bastions': sum(1 for seat in data['seats'] if seat['strength'] == 'weak'),
            'increasing_trend': sum(1 for seat in data['seats'] if seat['margin_trend'] == 'increasing'),
            'decreasing_trend': sum(1 for seat in data['seats'] if seat['margin_trend'] == 'decreasing'),
        })

    # Sort by total bastions
    party_summary.sort(key=lambda x: x['total_bastions'], reverse=True)

    return {
        'years': [2011, 2016, 2021],
        'total_bastion_seats': len(bastion_seats),
        'bastion_seats': bastion_seats,
        'party_summary': party_summary,
        'statistics': {
            'total_constituencies_analyzed': len(common_constituencies),
            'bastion_percentage': round((len(bastion_seats) / len(common_constituencies)) * 100, 2) if common_constituencies else 0,
            'strong_bastions': sum(1 for seat in bastion_seats if seat['strength'] == 'strong'),
            'moderate_bastions': sum(1 for seat in bastion_seats if seat['strength'] == 'moderate'),
            'weak_bastions': sum(1 for seat in bastion_seats if seat['strength'] == 'weak'),
            'increasing_trend': sum(1 for seat in bastion_seats if seat['margin_trend'] == 'increasing'),
            'decreasing_trend': sum(1 for seat in bastion_seats if seat['margin_trend'] == 'decreasing'),
        }
    }


@router.get("/{election_id}", response_model=ElectionResponse)
def get_election(election_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific election
    """
    election = db.query(Election).filter(Election.id == election_id).first()

    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    return election


@router.get("/{election_id}/results", response_model=List[ElectionResultResponse])
@limiter.limit(settings.RATE_LIMIT_HEAVY)
async def get_election_results(
    request: Request,
    election_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(234, ge=1, le=500),
    party: Optional[str] = None,
    winner_only: bool = False,
    db: Session = Depends(get_db),
):
    """
    Get all results for a specific election

    - **election_id**: ID of the election
    - **party**: Filter by party name
    - **winner_only**: If True, only return winning candidates

    **Rate limit**: 20 requests per minute (heavy query)
    """
    # Check if election exists
    election = db.query(Election).filter(Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    query = db.query(ElectionResult).filter(ElectionResult.election_id == election_id)

    # Apply filters
    if party:
        query = query.filter(ElectionResult.party == party)
    if winner_only:
        query = query.filter(ElectionResult.is_winner == 1)

    results = query.offset(skip).limit(limit).all()

    return results


@router.get("/constituency/{constituency_id}/history", response_model=List[ElectionResultResponse])
def get_constituency_history(
    constituency_id: int,
    db: Session = Depends(get_db),
):
    """
    Get historical election results for a specific constituency

    Returns all election results for this constituency, ordered by year (newest first)
    """
    # Check if constituency exists
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()
    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    # Get all results for this constituency, joined with election to order by year
    results = (
        db.query(ElectionResult)
        .join(Election, ElectionResult.election_id == Election.id)
        .filter(ElectionResult.constituency_id == constituency_id)
        .order_by(Election.year.desc())
        .all()
    )

    return results


@router.get("/year/{year}/results", response_model=List[ElectionResultResponse])
def get_results_by_year(
    year: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(234, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """
    Get all election results for a specific year
    """
    # Find election by year
    election = db.query(Election).filter(Election.year == year).first()
    if not election:
        raise HTTPException(status_code=404, detail=f"No election found for year {year}")

    results = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return results


@router.get("/bastion-seats/{from_year}/{to_year}")
def get_bastion_seats(
    from_year: int,
    to_year: int,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get bastion seats analysis - constituencies held by the same party
    with strong margins across two elections

    Bastion seats are identified by:
    - Same party winning in both elections
    - Strong winning margin in the most recent election
    """
    # Get elections for both years
    election_from = db.query(Election).filter(Election.year == from_year).first()
    election_to = db.query(Election).filter(Election.year == to_year).first()

    if not election_from:
        raise HTTPException(status_code=404, detail=f"No election found for year {from_year}")
    if not election_to:
        raise HTTPException(status_code=404, detail=f"No election found for year {to_year}")

    # Get winners from both elections
    winners_from = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_from.id, ElectionResult.is_winner == 1)
        .all()
    )

    winners_to = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_to.id, ElectionResult.is_winner == 1)
        .all()
    )

    # Create mapping of constituency_id to winner
    from_map = {w.constituency_id: w for w in winners_from}
    to_map = {w.constituency_id: w for w in winners_to}

    # Find bastion seats (same party, both elections)
    bastion_seats = []
    party_bastions = defaultdict(lambda: {'count': 0, 'seats': []})

    for const_id in set(from_map.keys()) & set(to_map.keys()):
        winner_from = from_map[const_id]
        winner_to = to_map[const_id]

        # Check if same party won both times
        if winner_from.party == winner_to.party:
            # Calculate average margin
            avg_margin = ((winner_from.margin or 0) + (winner_to.margin or 0)) / 2
            avg_margin_pct = ((winner_from.margin_pct or 0) + (winner_to.margin_pct or 0)) / 2

            bastion_data = {
                'constituency_id': const_id,
                'constituency_name': winner_to.ac_name,
                'ac_number': winner_to.ac_number,
                'party': winner_to.party,
                'margin_2016': winner_from.margin,
                'margin_2021': winner_to.margin,
                'avg_margin': int(avg_margin),
                'margin_pct_2016': winner_from.margin_pct,
                'margin_pct_2021': winner_to.margin_pct,
                'avg_margin_pct': avg_margin_pct,
                'vote_share_2016': winner_from.vote_share_pct,
                'vote_share_2021': winner_to.vote_share_pct,
                'candidate_2016': winner_from.candidate_name,
                'candidate_2021': winner_to.candidate_name,
                'margin_trend': 'increased' if winner_to.margin > winner_from.margin else 'decreased',
                'strength': 'strong' if avg_margin > 20000 else 'moderate' if avg_margin > 10000 else 'weak'
            }

            bastion_seats.append(bastion_data)
            party_bastions[winner_to.party]['count'] += 1
            party_bastions[winner_to.party]['seats'].append(bastion_data)

    # Sort bastion seats by average margin (strongest first)
    bastion_seats.sort(key=lambda x: x['avg_margin'], reverse=True)

    # Prepare party summary
    party_summary = []
    for party, data in party_bastions.items():
        # Calculate average strength
        total_avg_margin = sum(seat['avg_margin'] for seat in data['seats'])
        avg_party_margin = total_avg_margin / data['count'] if data['count'] > 0 else 0

        party_summary.append({
            'party': party,
            'total_bastions': data['count'],
            'avg_margin': int(avg_party_margin),
            'strong_bastions': sum(1 for seat in data['seats'] if seat['strength'] == 'strong'),
            'moderate_bastions': sum(1 for seat in data['seats'] if seat['strength'] == 'moderate'),
            'weak_bastions': sum(1 for seat in data['seats'] if seat['strength'] == 'weak'),
        })

    # Sort by total bastions
    party_summary.sort(key=lambda x: x['total_bastions'], reverse=True)

    return {
        'from_year': from_year,
        'to_year': to_year,
        'total_bastion_seats': len(bastion_seats),
        'bastion_seats': bastion_seats,
        'party_summary': party_summary,
        'statistics': {
            'total_constituencies_analyzed': len(set(from_map.keys()) & set(to_map.keys())),
            'strong_bastions': sum(1 for seat in bastion_seats if seat['strength'] == 'strong'),
            'moderate_bastions': sum(1 for seat in bastion_seats if seat['strength'] == 'moderate'),
            'weak_bastions': sum(1 for seat in bastion_seats if seat['strength'] == 'weak'),
        }
    }


@router.get("/swing-analysis/{from_year}/{to_year}")
def get_swing_analysis(
    from_year: int,
    to_year: int,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get swing analysis comparing two elections

    Returns:
    - Constituencies that flipped parties
    - Party-wise seat gains/losses
    - Margin changes
    - Overall statistics
    """
    # Get elections for both years
    election_from = db.query(Election).filter(Election.year == from_year).first()
    election_to = db.query(Election).filter(Election.year == to_year).first()

    if not election_from:
        raise HTTPException(status_code=404, detail=f"No election found for year {from_year}")
    if not election_to:
        raise HTTPException(status_code=404, detail=f"No election found for year {to_year}")

    # Get winners from both elections
    winners_from = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_from.id, ElectionResult.is_winner == 1)
        .all()
    )

    winners_to = (
        db.query(ElectionResult)
        .filter(ElectionResult.election_id == election_to.id, ElectionResult.is_winner == 1)
        .all()
    )

    # Create mapping of constituency_id to winner
    from_map = {w.constituency_id: w for w in winners_from}
    to_map = {w.constituency_id: w for w in winners_to}

    # Analyze flips and changes
    flips = []
    party_changes = defaultdict(lambda: {'gained': 0, 'lost': 0})
    margin_changes = []

    for const_id in set(from_map.keys()) | set(to_map.keys()):
        winner_from = from_map.get(const_id)
        winner_to = to_map.get(const_id)

        if winner_from and winner_to:
            party_from = winner_from.party
            party_to = winner_to.party

            # Check if party changed
            if party_from != party_to:
                flips.append({
                    'constituency_id': const_id,
                    'constituency_name': winner_to.ac_name,
                    'ac_number': winner_to.ac_number,
                    'from_party': party_from,
                    'to_party': party_to,
                    'from_candidate': winner_from.candidate_name,
                    'to_candidate': winner_to.candidate_name,
                    'from_votes': winner_from.total_votes,
                    'to_votes': winner_to.total_votes,
                    'from_margin': winner_from.margin,
                    'to_margin': winner_to.margin,
                })

                party_changes[party_from]['lost'] += 1
                party_changes[party_to]['gained'] += 1

            # Track margin changes
            margin_changes.append({
                'constituency_id': const_id,
                'constituency_name': winner_to.ac_name,
                'ac_number': winner_to.ac_number,
                'party': party_to,
                'from_margin': winner_from.margin or 0,
                'to_margin': winner_to.margin or 0,
                'margin_change': (winner_to.margin or 0) - (winner_from.margin or 0),
                'from_margin_pct': winner_from.margin_pct,
                'to_margin_pct': winner_to.margin_pct,
            })

    # Calculate party-wise summary
    party_summary = []
    for party, changes in party_changes.items():
        party_summary.append({
            'party': party,
            'gained': changes['gained'],
            'lost': changes['lost'],
            'net_change': changes['gained'] - changes['lost'],
        })

    # Sort by net change
    party_summary.sort(key=lambda x: x['net_change'], reverse=True)

    # Sort flips by constituency name
    flips.sort(key=lambda x: x['constituency_name'])

    # Top margin increases/decreases
    margin_changes.sort(key=lambda x: x['margin_change'], reverse=True)

    return {
        'from_year': from_year,
        'to_year': to_year,
        'total_flips': len(flips),
        'flips': flips,
        'party_summary': party_summary,
        'margin_changes': {
            'top_increases': margin_changes[:10],
            'top_decreases': margin_changes[-10:],
        },
        'statistics': {
            'total_constituencies_compared': len(set(from_map.keys()) & set(to_map.keys())),
            'constituencies_unchanged': len(set(from_map.keys()) & set(to_map.keys())) - len(flips),
        }
    }
