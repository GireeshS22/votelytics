"""API endpoints for constituencies"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.constituency import Constituency
from app.schemas.constituency import (
    ConstituencyResponse,
    ConstituencyList,
    ConstituencyCreate,
    ConstituencyUpdate,
)

router = APIRouter()


@router.get("/", response_model=ConstituencyList)
def get_constituencies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    district: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get list of all constituencies with optional filters

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **district**: Filter by district name
    - **region**: Filter by region (North, South, Central, West)
    """
    query = db.query(Constituency)

    # Apply filters
    if district:
        query = query.filter(Constituency.district == district)
    if region:
        query = query.filter(Constituency.region == region)

    # Get total count
    total = query.count()

    # Apply pagination
    constituencies = query.offset(skip).limit(limit).all()

    return {
        "constituencies": constituencies,
        "total": total,
    }


@router.get("/{constituency_id}", response_model=ConstituencyResponse)
def get_constituency(constituency_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific constituency by ID
    """
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()

    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    return constituency


@router.get("/code/{code}", response_model=ConstituencyResponse)
def get_constituency_by_code(code: str, db: Session = Depends(get_db)):
    """
    Get constituency information by constituency code
    """
    constituency = db.query(Constituency).filter(Constituency.code == code).first()

    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    return constituency


@router.post("/", response_model=ConstituencyResponse, status_code=201)
def create_constituency(
    constituency: ConstituencyCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new constituency (admin only - to be protected with auth)
    """
    # Check if constituency with same code already exists
    existing = db.query(Constituency).filter(Constituency.code == constituency.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Constituency with this code already exists")

    # Create new constituency
    db_constituency = Constituency(**constituency.model_dump())
    db.add(db_constituency)
    db.commit()
    db.refresh(db_constituency)

    return db_constituency


@router.get("/district/{district}", response_model=List[ConstituencyResponse])
def get_constituencies_by_district(district: str, db: Session = Depends(get_db)):
    """
    Get all constituencies in a specific district
    """
    constituencies = db.query(Constituency).filter(Constituency.district == district).all()

    if not constituencies:
        raise HTTPException(status_code=404, detail="No constituencies found in this district")

    return constituencies
