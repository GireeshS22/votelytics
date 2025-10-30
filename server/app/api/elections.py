"""API endpoints for elections and results"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.election import Election, ElectionResult
from app.models.constituency import Constituency
from app.schemas.election import (
    ElectionResponse,
    ElectionResultResponse,
    ConstituencyElectionHistory,
)

router = APIRouter()


@router.get("/", response_model=List[ElectionResponse])
def get_elections(
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
def get_election_results(
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
