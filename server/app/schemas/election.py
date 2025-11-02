"""Pydantic schemas for Election API"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime


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
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ElectionResultBase(BaseModel):
    """Base schema for Election Result"""
    election_id: int
    constituency_id: int
    candidate_id: Optional[int] = None

    # Denormalized election data
    year: int

    # Denormalized constituency data
    ac_number: int
    ac_name: str
    total_electors: Optional[int] = None

    # Candidate details
    candidate_name: str
    sex: Optional[str] = None
    age: Optional[int] = None
    category: Optional[str] = None

    # Party details
    party: str
    symbol: Optional[str] = None
    alliance: Optional[str] = None

    # Vote counts
    general_votes: int = 0
    postal_votes: int = 0
    total_votes: int
    vote_share_pct: Optional[float] = None

    # Result metadata
    rank: Optional[int] = None
    is_winner: int = 0
    margin: Optional[int] = None
    margin_pct: Optional[float] = None

    extra_data: Optional[dict] = None


class ElectionResultResponse(ElectionResultBase):
    """Schema for Election Result API response"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConstituencyElectionHistory(BaseModel):
    """Schema for constituency's historical election results"""
    constituency_id: int
    constituency_name: str
    results: List[ElectionResultResponse]
