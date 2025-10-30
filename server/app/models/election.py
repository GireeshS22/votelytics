"""Election models - historical election data"""
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Float, JSON
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

    # Relationship with results
    results = relationship("ElectionResult", back_populates="election")

    def __repr__(self):
        return f"<Election {self.year} - {self.name}>"


class ElectionResult(Base):
    """
    Election Result model
    Stores results for each constituency in an election
    """

    __tablename__ = "election_results"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False, index=True)
    constituency_id = Column(Integer, ForeignKey("constituencies.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=True)

    # Result details
    candidate_name = Column(String(200), nullable=False)
    party = Column(String(100), nullable=False, index=True)

    # Vote counts
    votes_received = Column(Integer, nullable=False)
    vote_share_pct = Column(Float)
    total_votes_polled = Column(Integer)
    total_valid_votes = Column(Integer)

    # Winner info
    is_winner = Column(Integer, default=0)  # 1 if winner, 0 otherwise
    margin = Column(Integer)  # Victory margin in votes
    margin_pct = Column(Float)  # Victory margin as percentage

    # Alliance/Coalition
    alliance = Column(String(100))  # DMK Alliance, AIADMK Alliance, etc.

    # Additional data
    extra_data = Column(JSON)  # For any extra info

    # Relationships
    election = relationship("Election", back_populates="results")

    def __repr__(self):
        return f"<ElectionResult {self.candidate_name} - {self.party}>"
