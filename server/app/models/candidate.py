"""Candidate model - information about political candidates"""
from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Text
from app.database import Base


class Candidate(Base):
    """
    Candidate model
    Stores information about candidates contesting elections
    """

    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    name = Column(String(200), nullable=False, index=True)
    party = Column(String(100), nullable=False, index=True)
    alliance = Column(String(100))  # DMK Alliance, AIADMK Alliance, etc.

    # Constituency (for upcoming election)
    constituency_id = Column(Integer, ForeignKey("constituencies.id"), nullable=True, index=True)

    # Candidate details
    age = Column(Integer)
    gender = Column(String(20))
    education = Column(String(200))
    profession = Column(String(200))

    # Political background
    is_incumbent = Column(Integer, default=0)  # 1 if sitting MLA
    previous_elections_contested = Column(Integer)
    previous_wins = Column(Integer)

    # Bio
    bio = Column(Text)

    # Additional data (criminal cases, assets, etc.)
    extra_data = Column(JSON)

    # Photo URL
    photo_url = Column(String(500))

    def __repr__(self):
        return f"<Candidate {self.name} - {self.party}>"
