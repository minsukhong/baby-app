from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.profile import Profile
from schemas.profile import ProfileCreate, ProfileResponse
from core.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("", response_model=ProfileResponse, status_code=201)
def create_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if existing:
        # 이미 있으면 업데이트
        for key, value in data.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    profile = Profile(user_id=current_user.id, **data.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="프로필이 없습니다.")
    return profile
