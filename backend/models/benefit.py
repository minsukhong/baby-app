from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, Text, JSON
from sqlalchemy.sql import func
from database import Base


class Benefit(Base):
    __tablename__ = "benefits"

    id                      = Column(String(20), primary_key=True)
    name                    = Column(String(200), nullable=False)
    category                = Column(String(20), default="national")
    region                  = Column(String(50), default="전국")
    stage                   = Column(String(50))

    amount_single           = Column(Integer)
    amount_multiple         = Column(Integer)
    amount_first            = Column(Integer)
    amount_second_plus      = Column(Integer)
    amount_description      = Column(Text)
    payment_type            = Column(String(50))
    representative_amount   = Column(Integer, default=0)

    income_condition        = Column(String(300))
    income_max_ratio        = Column(Integer)
    application_deadline    = Column(String(200))
    usage_deadline          = Column(String(200))
    target_detail           = Column(Text)
    application_start_week  = Column(Integer)
    apply_within_days       = Column(Integer)

    is_per_child                = Column(Boolean, default=False)  # True면 아이 수만큼 금액 곱함

    applies_to_employed         = Column(Boolean, default=True)
    applies_to_self_employed    = Column(Boolean, default=True)
    applies_to_unemployed       = Column(Boolean, default=True)
    applies_to_pregnant         = Column(Boolean, default=True)
    applies_to_born             = Column(Boolean, default=True)

    source_url      = Column(Text)
    reference_url   = Column(Text)
    is_available    = Column(Boolean, default=True)
    last_verified   = Column(Date)
    verified_by     = Column(String(50), default="manual")
    raw_data        = Column(JSON)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
