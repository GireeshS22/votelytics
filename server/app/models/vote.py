"""PublicVote model - visitor poll votes"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base


class PublicVote(Base):
    """
    PublicVote model
    Stores visitor poll votes (non-binding, anonymous)
    """

    __tablename__ = "public_votes"

    id = Column(Integer, primary_key=True, index=True)
    constituency_id = Column(Integer, ForeignKey("constituencies.id"), nullable=False, index=True)
    alliance = Column(String(100), nullable=False)
    session_id = Column(String(64), nullable=False, index=True)  # browser fingerprint / uuid
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<PublicVote constituency={self.constituency_id} alliance={self.alliance}>"
