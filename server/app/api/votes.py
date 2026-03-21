"""
API endpoints for visitor poll votes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, field_validator
from typing import Optional

from app.database import get_db
from app.models.vote import PublicVote
from app.models.constituency import Constituency

router = APIRouter()

ALLOWED_ALLIANCES = [
    "DMK+",
    "AIADMK+",
    "NTK",
    "TVK",
    "BJP+",
    "Others",
]


class VoteRequest(BaseModel):
    constituency_id: int
    alliance: str
    session_id: str

    @field_validator("alliance")
    @classmethod
    def validate_alliance(cls, v: str) -> str:
        if v not in ALLOWED_ALLIANCES:
            raise ValueError(f"Invalid alliance. Must be one of: {', '.join(ALLOWED_ALLIANCES)}")
        return v

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: str) -> str:
        if not v or len(v) < 8 or len(v) > 64:
            raise ValueError("session_id must be 8-64 characters")
        return v


@router.post("/")
async def cast_vote(vote: VoteRequest, db: Session = Depends(get_db)):
    """Cast a visitor poll vote. One vote per session per constituency."""
    # Verify constituency exists
    constituency = db.query(Constituency).filter(Constituency.id == vote.constituency_id).first()
    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    # Check if this session already voted for this constituency
    existing = db.query(PublicVote).filter(
        PublicVote.session_id == vote.session_id,
        PublicVote.constituency_id == vote.constituency_id,
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Already voted for this constituency")

    # Save vote
    new_vote = PublicVote(
        constituency_id=vote.constituency_id,
        alliance=vote.alliance,
        session_id=vote.session_id,
    )
    db.add(new_vote)
    db.commit()
    db.refresh(new_vote)

    return {"success": True, "vote_id": new_vote.id}


@router.get("/results")
async def get_all_results(db: Session = Depends(get_db)):
    """Get statewide vote results aggregated by alliance."""
    rows = db.query(
        PublicVote.alliance,
        func.count(PublicVote.id).label("count"),
    ).group_by(PublicVote.alliance).all()

    total = sum(r.count for r in rows)
    results = [
        {
            "alliance": r.alliance,
            "votes": r.count,
            "percentage": round(r.count / total * 100, 1) if total else 0,
        }
        for r in rows
    ]
    results.sort(key=lambda x: x["votes"], reverse=True)

    return {"total_votes": total, "results": results}


@router.get("/results/{constituency_id}")
async def get_constituency_results(constituency_id: int, db: Session = Depends(get_db)):
    """Get vote results for a specific constituency."""
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()
    if not constituency:
        raise HTTPException(status_code=404, detail="Constituency not found")

    rows = db.query(
        PublicVote.alliance,
        func.count(PublicVote.id).label("count"),
    ).filter(
        PublicVote.constituency_id == constituency_id
    ).group_by(PublicVote.alliance).all()

    total = sum(r.count for r in rows)
    results = [
        {
            "alliance": r.alliance,
            "votes": r.count,
            "percentage": round(r.count / total * 100, 1) if total else 0,
        }
        for r in rows
    ]
    results.sort(key=lambda x: x["votes"], reverse=True)

    return {
        "constituency_id": constituency_id,
        "constituency_name": constituency.name,
        "total_votes": total,
        "results": results,
    }
