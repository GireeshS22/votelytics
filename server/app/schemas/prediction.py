"""
Pydantic schemas for predictions
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AllianceVoteShare(BaseModel):
    """Vote share for an alliance"""
    alliance: str = Field(..., description="Alliance name (DMK+, AIADMK+, NTK, etc.)")
    lead_party: str = Field(..., description="Lead party in alliance")
    vote_share: float = Field(..., ge=0, le=100, description="Predicted vote share percentage")


class PredictionBase(BaseModel):
    """Base prediction schema"""
    constituency_id: int
    predicted_year: int = 2026
    predicted_winner_alliance: str = Field(..., description="Winning alliance (DMK+, AIADMK+, etc.)")
    predicted_winner_party: str = Field(..., description="Specific party winning the seat")
    predicted_winner_name: Optional[str] = None
    confidence_level: str = Field(..., description="Safe, Likely, Lean, or Toss-up")
    win_probability: float = Field(..., ge=0, le=1, description="Win probability 0-1")
    predicted_vote_share: float = Field(..., ge=0, le=100)
    predicted_margin_pct: float = Field(..., ge=0, le=100)
    top_alliances: List[AllianceVoteShare] = Field(..., description="Top 3-4 alliances with vote shares")
    swing_from_last_election: float = Field(..., description="Swing from 2021 election")
    key_factors: str = Field(..., description="Explanation of prediction factors")
    prediction_model: str = "ChatGPT"


class PredictionCreate(PredictionBase):
    """Schema for creating a prediction"""
    extra_data: Optional[Dict[str, Any]] = None


class PredictionResponse(PredictionBase):
    """Schema for prediction API response"""
    id: int
    created_at: datetime
    updated_at: datetime
    extra_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class ChatGPTPromptData(BaseModel):
    """Data structure for building ChatGPT prompts"""
    constituency_name: str
    ac_number: int
    district: str
    region: str
    population: int
    urban_pct: float
    literacy_rate: float
    historical_results: Dict[str, Any]  # Results mapped to alliances
    alliance_config: Dict[str, Any]
    trends_summary: str


class ChatGPTResponse(BaseModel):
    """Expected response format from ChatGPT"""
    predicted_winner_alliance: str
    predicted_winner_party: str
    predicted_winner_name: Optional[str] = None
    confidence_level: str
    win_probability: float
    predicted_vote_share: float
    predicted_margin_pct: float
    top_alliances: List[Dict[str, Any]]  # Will be converted to AllianceVoteShare
    swing_from_last_election: float
    key_factors: str
