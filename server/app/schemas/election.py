"""Pydantic schemas for Election API"""
from pydantic import BaseModel, ConfigDict, field_validator
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

    @field_validator("year")
    @classmethod
    def validate_year(cls, v: int) -> int:
        """Validate year is within reasonable range"""
        if v < 1950 or v > 2050:
            raise ValueError("Year must be between 1950 and 2050")
        return v

    @field_validator("name")
    @classmethod
    def validate_name_length(cls, v: str) -> str:
        """Validate name length"""
        if len(v) > 200:
            raise ValueError("Name must be less than 200 characters")
        return v.strip()

    @field_validator("total_seats")
    @classmethod
    def validate_total_seats(cls, v: Optional[int]) -> Optional[int]:
        """Validate total seats is positive"""
        if v is not None and v < 1:
            raise ValueError("Total seats must be positive")
        return v

    @field_validator("voter_turnout_pct")
    @classmethod
    def validate_turnout(cls, v: Optional[float]) -> Optional[float]:
        """Validate turnout percentage is valid"""
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Voter turnout must be between 0 and 100")
        return v


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
