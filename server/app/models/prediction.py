"""Prediction model - electoral forecasts and predictions"""
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.database import Base


class Prediction(Base):
    """
    Prediction model
    Stores electoral predictions for constituencies
    """

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    constituency_id = Column(Integer, ForeignKey("constituencies.id"), nullable=False, index=True)

    # Prediction details
    predicted_year = Column(Integer, nullable=False, index=True)  # Which election
    predicted_winner_party = Column(String(100), nullable=False, index=True)
    predicted_winner_name = Column(String(200))

    # Confidence and probability
    confidence_level = Column(String(20))  # Safe, Likely, Lean, Toss-up
    win_probability = Column(Float)  # 0.0 to 1.0

    # Vote share predictions
    predicted_vote_share = Column(Float)
    predicted_margin_pct = Column(Float)

    # Predicted top candidates (stored as JSON)
    # Format: [{"party": "DMK", "vote_share": 45.5}, {"party": "AIADMK", "vote_share": 38.2}, ...]
    top_candidates = Column(JSON)

    # Analysis
    swing_from_last_election = Column(Float)  # Positive or negative swing
    key_factors = Column(Text)  # Text explanation of prediction factors

    # Model/Algorithm used
    prediction_model = Column(String(100))  # "ML Model", "Expert Opinion", "Polling Data"

    # Metadata
    extra_data = Column(JSON)

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Prediction {self.predicted_year} - {self.predicted_winner_party}>"
