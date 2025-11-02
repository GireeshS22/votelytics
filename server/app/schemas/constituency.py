"""Pydantic schemas for Constituency API"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
from datetime import datetime


class ConstituencyBase(BaseModel):
    """Base schema for Constituency"""
    ac_number: int
    name: str
    code: str
    district: Optional[str] = None
    region: Optional[str] = None
    population: Optional[int] = None
    urban_population_pct: Optional[float] = None
    literacy_rate: Optional[float] = None
    extra_data: Optional[dict] = None
    geojson: Optional[dict] = None


class ConstituencyResponse(ConstituencyBase):
    """Schema for Constituency API response"""
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConstituencyList(BaseModel):
    """Schema for list of constituencies"""
    constituencies: List[ConstituencyResponse]
    total: int


class ConstituencyCreate(ConstituencyBase):
    """Schema for creating a new constituency"""
    pass


class ConstituencyUpdate(BaseModel):
    """Schema for updating constituency (all fields optional)"""
    name: Optional[str] = None
    code: Optional[str] = None
    district: Optional[str] = None
    region: Optional[str] = None
    population: Optional[int] = None
    urban_population_pct: Optional[float] = None
    literacy_rate: Optional[float] = None
    extra_data: Optional[dict] = None
    geojson: Optional[dict] = None
