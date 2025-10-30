"""Database models for Votelytics"""
from app.models.constituency import Constituency
from app.models.election import Election, ElectionResult
from app.models.candidate import Candidate
from app.models.prediction import Prediction

__all__ = [
    "Constituency",
    "Election",
    "ElectionResult",
    "Candidate",
    "Prediction",
]
