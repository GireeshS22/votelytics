"""API endpoints for constituencies"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import re

from app.database import get_db
from app.models.constituency import Constituency
from app.models.candidate import Candidate
from app.schemas.constituency import (
    ConstituencyResponse,
    ConstituencyList,
    ConstituencyCreate,
    ConstituencyUpdate,
)
from app.api.dependencies import verify_admin_key
from app.rate_limiters import limiter
from app.config import settings

router = APIRouter()


# Columns for the list endpoint — geojson is intentionally excluded.
# It is ~2.9 KB per row × 234 rows = ~680 KB per request, and almost no
# caller of GET /constituencies/ actually uses it. The map page fetches
# polygons separately from /constituencies/boundaries.
_LIST_COLUMNS = (
    Constituency.id,
    Constituency.ac_number,
    Constituency.name,
    Constituency.code,
    Constituency.slug,
    Constituency.district,
    Constituency.region,
    Constituency.population,
    Constituency.urban_population_pct,
    Constituency.literacy_rate,
    Constituency.extra_data,
    Constituency.created_at,
    Constituency.updated_at,
)


def _row_to_dict(row) -> dict:
    return {
        "id": row.id,
        "ac_number": row.ac_number,
        "name": row.name,
        "code": row.code,
        "slug": row.slug,
        "district": row.district,
        "region": row.region,
        "population": row.population,
        "urban_population_pct": row.urban_population_pct,
        "literacy_rate": row.literacy_rate,
        "extra_data": row.extra_data,
        "geojson": None,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


@router.get("/", response_model=ConstituencyList)
@limiter.limit(settings.RATE_LIMIT_PUBLIC)
async def get_constituencies(
    request: Request,
    response: Response,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    district: Optional[str] = None,
    region: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get list of all constituencies with optional filters.

    Note: `geojson` is always null on this endpoint. Fetch boundaries
    from `/constituencies/boundaries` (cached separately).

    **Rate limit**: 100 requests per minute
    """
    query = db.query(*_LIST_COLUMNS)

    if district:
        query = query.filter(Constituency.district == district)
    if region:
        query = query.filter(Constituency.region == region)

    total = query.count()
    rows = query.offset(skip).limit(limit).all()

    response.headers["Cache-Control"] = "public, max-age=3600, s-maxage=3600"
    return {
        "constituencies": [_row_to_dict(r) for r in rows],
        "total": total,
    }


@router.get("/boundaries")
async def get_constituencies_boundaries(
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Return GeoJSON polygons for all constituencies in a single response.

    Cached for 24h via Cache-Control so browsers and any CDN serve it
    without hitting Supabase. Constituency boundaries do not change.
    """
    rows = (
        db.query(
            Constituency.id,
            Constituency.ac_number,
            Constituency.name,
            Constituency.slug,
            Constituency.geojson,
        )
        .order_by(Constituency.ac_number)
        .all()
    )

    response.headers["Cache-Control"] = "public, max-age=86400, s-maxage=86400"
    return {
        "boundaries": [
            {
                "id": r.id,
                "ac_number": r.ac_number,
                "name": r.name,
                "slug": r.slug,
                "geojson": r.geojson,
            }
            for r in rows
            if r.geojson is not None
        ]
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


@router.get("/slug/{slug}", response_model=ConstituencyResponse)
def get_constituency_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Get constituency information by SEO-friendly slug
    Example: /constituencies/slug/gummidipoondi
    Handles malformed URLs with parentheses and periods by normalizing them
    """
    # Normalize slug: remove parentheses, periods, and collapse multiple hyphens
    normalized_slug = re.sub(r'[().]', '', slug)  # Remove parentheses and periods
    normalized_slug = re.sub(r'-+', '-', normalized_slug)  # Collapse multiple hyphens
    normalized_slug = normalized_slug.strip('-')  # Remove leading/trailing hyphens

    constituency = db.query(Constituency).filter(Constituency.slug == normalized_slug).first()

    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    return constituency


@router.post("/", response_model=ConstituencyResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_ADMIN)
async def create_constituency(
    request: Request,
    constituency: ConstituencyCreate,
    db: Session = Depends(get_db),
    admin_key: str = Depends(verify_admin_key),
):
    """
    Create a new constituency (admin only - requires admin API key)

    Requires: X-Admin-Key header with valid admin API key

    **Security**: This endpoint is protected and requires admin authentication.
    Include the admin API key in request headers as 'X-Admin-Key'.

    **Rate limit**: 500 requests per minute (admin operations)
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


@router.get("/{constituency_id}/infographic")
def get_constituency_infographic(constituency_id: int, db: Session = Depends(get_db)):
    """
    Get infographic URL for a constituency.
    Returns the Supabase Storage public URL if generated, else 404.
    """
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()
    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    url = (constituency.extra_data or {}).get("infographic_url")
    if not url:
        raise HTTPException(status_code=404, detail="Infographic not yet generated")

    return {"url": url, "slug": constituency.slug}


@router.get("/{constituency_id}/candidates")
def get_constituency_candidates(
    constituency_id: int,
    election_year: int = Query(default=2026),
    db: Session = Depends(get_db)
):
    """
    Get 2026 candidates for a constituency (SPA, NDA, TVK, NTK)
    """
    candidates = (
        db.query(Candidate)
        .filter(
            Candidate.constituency_id == constituency_id,
            Candidate.extra_data["election_year"].as_integer() == election_year,
        )
        .all()
    )

    return {
        "constituency_id": constituency_id,
        "election_year": election_year,
        "candidates": [
            {
                "id":       c.id,
                "name":     c.name,
                "party":    c.party,
                "alliance": c.alliance,
            }
            for c in candidates
        ],
    }
