"""Election models - historical election data"""
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, JSON, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Election(Base):
    """
    Election model
    Represents a specific election (e.g., 2021 TN Assembly Election)
    """

    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)

    # Election details
    year = Column(Integer, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    election_type = Column(String(50), nullable=False)  # Assembly, Lok Sabha
    state = Column(String(100), default="Tamil Nadu")
    election_date = Column(Date, nullable=False)

    # Summary statistics
    total_seats = Column(Integer)
    total_voters = Column(Integer)
    voter_turnout_pct = Column(Float)

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship with results
    results = relationship("ElectionResult", back_populates="election")

    def __repr__(self):
        return f"<Election {self.year} - {self.name}>"


class ElectionResult(Base):
    """
    Election Result model
    Stores results for each constituency in an election
    Denormalized for performance and historical tracking
    """

    __tablename__ = "election_results"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False, index=True)
    constituency_id = Column(Integer, ForeignKey("constituencies.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=True)

    # Denormalized election data (for fast filtering)
    year = Column(Integer, nullable=False, index=True)

    # Denormalized constituency data (snapshot for this election)
    ac_number = Column(Integer, nullable=False, index=True)
    ac_name = Column(String(200), nullable=False, index=True)
    ac_slug = Column(String(200), index=True)  # Constituency slug for SEO-friendly URLs
    total_electors = Column(Integer)  # Per constituency per year

    # Candidate details
    candidate_name = Column(String(200), nullable=False)
    sex = Column(String(20))  # MALE/FEMALE/THIRD
    age = Column(Integer)
    category = Column(String(20))  # GENERAL/SC/ST

    # Party details
    party = Column(String(100), nullable=False, index=True)
    symbol = Column(String(200))
    alliance = Column(String(100))  # DMK Alliance, AIADMK Alliance, etc.

    # Vote counts (split by type)
    general_votes = Column(Integer, default=0)
    postal_votes = Column(Integer, default=0)
    total_votes = Column(Integer, nullable=False)
    vote_share_pct = Column(Float)

    # Result metadata
    rank = Column(Integer)  # 1st, 2nd, 3rd, etc. within constituency
    is_winner = Column(Integer, default=0)  # 1 if winner, 0 otherwise
    margin = Column(Integer)  # Victory margin in votes (for winner and runner-up)
    margin_pct = Column(Float)  # Victory margin as percentage

    # Additional data
    extra_data = Column(JSON)  # For any extra info

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    election = relationship("Election", back_populates="results")

    def __repr__(self):
        return f"<ElectionResult {self.candidate_name} - {self.party} ({self.year})>"
