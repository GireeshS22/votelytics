"""Constituency model - represents electoral constituencies"""
from sqlalchemy import Column, Integer, String, Float, JSON
from app.database import Base


class Constituency(Base):
    """
    Electoral constituency model
    Stores information about each constituency in Tamil Nadu
    """

    __tablename__ = "constituencies"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    name = Column(String(200), nullable=False, unique=True, index=True)
    code = Column(String(10), nullable=False, unique=True, index=True)

    # Location
    district = Column(String(100), nullable=False, index=True)
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

    def __repr__(self):
        return f"<Constituency {self.name} ({self.code})>"
