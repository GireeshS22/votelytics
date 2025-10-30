"""Pydantic schemas for Election API"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date


class ElectionBase(BaseModel):
    """Base schema for Election"""
    year: int
    name: str
    election_type: str
    state: str = "Tamil Nadu"
    election_date: date
    total_seats: Optional[int] = None
    total_voters: Optional[int] = None
    voter_turnout_pct: Optional[float] = None


class ElectionResponse(ElectionBase):
    """Schema for Election API response"""
    id: int

    model_config = ConfigDict(from_attributes=True)


class ElectionResultBase(BaseModel):
    """Base schema for Election Result"""
    election_id: int
    constituency_id: int
    candidate_id: Optional[int] = None
    candidate_name: str
    party: str
    votes_received: int
    vote_share_pct: Optional[float] = None
    total_votes_polled: Optional[int] = None
    total_valid_votes: Optional[int] = None
    is_winner: int = 0
    margin: Optional[int] = None
    margin_pct: Optional[float] = None
    alliance: Optional[str] = None
    extra_data: Optional[dict] = None


class ElectionResultResponse(ElectionResultBase):
    """Schema for Election Result API response"""
    id: int

    model_config = ConfigDict(from_attributes=True)


class ConstituencyElectionHistory(BaseModel):
    """Schema for constituency's historical election results"""
    constituency_id: int
    constituency_name: str
    results: List[ElectionResultResponse]
