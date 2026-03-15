import uuid
from sqlalchemy import Column, String, Date, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    # 아기 정보
    birth_status = Column(String(20), nullable=False)   # 'pregnant' | 'born'
    baby_date = Column(Date, nullable=False)             # 예정일 or 생일
    baby_count = Column(String(20), nullable=False)     # 'single' | 'twins' | 'triplets_plus'
    birth_order = Column(String(20), nullable=False)    # 'first' | 'second_plus'

    # 부모 정보
    region = Column(String(100), nullable=False)        # 거주 지역
    job_status = Column(String(20), nullable=False)     # 'employed' | 'self_employed' | 'unemployed'

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
