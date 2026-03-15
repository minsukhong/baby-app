from pydantic import BaseModel
from datetime import date
from typing import Optional


class ProfileCreate(BaseModel):
    birth_status: str   # 'pregnant' | 'born'
    baby_date: date     # 예정일 or 생일
    baby_count: str     # 'single' | 'twins' | 'triplets_plus'
    birth_order: str    # 'first' | 'second_plus'
    region: str
    job_status: str     # 'employed' | 'self_employed' | 'unemployed'


class ProfileResponse(BaseModel):
    birth_status: str
    baby_date: date
    baby_count: str
    birth_order: str
    region: str
    job_status: str

    class Config:
        from_attributes = True
