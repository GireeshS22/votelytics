"""Constituency model - represents electoral constituencies"""
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Constituency(Base):
    """
    Electoral constituency model
    Stores information about each constituency in Tamil Nadu
    """

    __tablename__ = "constituencies"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    ac_number = Column(Integer, nullable=False, unique=True, index=True)  # 1-234
    name = Column(String(200), nullable=False, index=True)
    code = Column(String(10), nullable=False, unique=True, index=True)
    slug = Column(String(200), nullable=True, unique=True, index=True)  # SEO-friendly URL slug

    # Location
    district = Column(String(100), nullable=True, index=True)
    region = Column(String(50))  # North, South, Central, West

    # Demographics (can be updated from census data)
    population = Column(Integer)
    urban_population_pct = Column(Float)  # Percentage urban
    literacy_rate = Column(Float)

    # Additional data (stored as JSON for flexibility)
    # Can include: major communities, key issues, etc.
    extra_data = Column(JSON)

    # GeoJSON properties (for map visualization)
    # Will store boundary coordinates
    geojson = Column(JSON)

    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Constituency {self.name} ({self.code})>"
