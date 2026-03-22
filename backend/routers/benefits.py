from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.profile import Profile
from models.benefit import Benefit
from models.user_benefit import UserBenefit
from core.deps import get_current_user

router = APIRouter(prefix="/benefits", tags=["benefits"])

# ── 지역명 정규화 맵 (프론트 full name → DB short name) ───────────────────────
REGION_MAP = {
    "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구",
    "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
    "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기",
    "강원도": "강원", "충청북도": "충북", "충청남도": "충남",
    "전라북도": "전북", "전라남도": "전남", "경상북도": "경북",
    "경상남도": "경남", "제주특별자치도": "제주",
}

# ── 소득 구간 → 월 소득 상한 (원) ────────────────────────────────────────────
INCOME_RANGE_AMOUNT = {
    "under500":  5_000_000,
    "500to800":  8_000_000,
    "800to1100": 11_000_000,
    "over1100":  999_999_999,
    "unknown":   None,  # 필터 안 함
}

# ── income_max_ratio → 월 소득 기준 (4인 가구, 원) ───────────────────────────
INCOME_RATIO_AMOUNT = {
    150: 9_160_000,
    180: 10_980_000,
}


def normalize_region(region: str) -> str:
    return REGION_MAP.get(region, region)


def calc_personalized_amount(benefit: Benefit, profile: Profile) -> int:
    """프로필(단태아/다태아, 첫째/둘째이상) 기반으로 실제 혜택 금액 계산"""
    is_multiple    = profile.baby_count in ("twins", "triplets_plus")
    is_second_plus = profile.birth_order == "second_plus"

    # 1순위: 단태아/다태아 구분
    if is_multiple and benefit.amount_multiple:
        return benefit.amount_multiple
    if not is_multiple and benefit.amount_single:
        return benefit.amount_single

    # 2순위: 첫째/둘째이상 구분
    if is_second_plus and benefit.amount_second_plus:
        return benefit.amount_second_plus
    if not is_second_plus and benefit.amount_first:
        return benefit.amount_first

    # 3순위: fallback
    return benefit.representative_amount or 0


def income_qualifies(profile_income_range: str, benefit_income_max_ratio: Optional[int]) -> bool:
    """사용자 소득 구간이 혜택 소득 조건을 충족하는지 확인"""
    if benefit_income_max_ratio is None:
        return True  # 소득 조건 없음
    if profile_income_range == "unknown":
        return True  # 모르면 일단 보여줌 (배지 표시)
    user_amount = INCOME_RANGE_AMOUNT.get(profile_income_range)
    if user_amount is None:
        return True
    limit_amount = INCOME_RATIO_AMOUNT.get(benefit_income_max_ratio, 999_999_999)
    return user_amount <= limit_amount


# ── 스키마 ────────────────────────────────────────────────────────────────────
class BenefitOut(BaseModel):
    id:                     str
    name:                   str
    category:               str
    region:                 str
    stage:                  Optional[str]
    amount_description:     Optional[str]
    payment_type:           Optional[str]
    representative_amount:  Optional[int]
    income_condition:       Optional[str]
    income_max_ratio:       Optional[int]
    application_deadline:   Optional[str]
    apply_within_days:      Optional[int]
    application_start_week: Optional[int]
    source_url:             Optional[str]
    status:                 str   # locked / available / applied / completed
    urgency_message:        Optional[str]  # "지금 신청하세요!", "32주부터 신청 가능" 등

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    total_amount:       int   # 받을 수 있는 총 혜택 금액 (확정+조건부)
    confirmed_amount:   int   # 소득조건 없는 확정 금액
    conditional_amount: int   # 소득조건 있는 조건부 금액
    achieved_amount:    int   # 신청 완료 금액
    remaining_amount:   int   # 잔여 금액
    achievement_rate:   float # 달성률 (확정금액 기준, 100% 초과 가능)
    total_count:        int
    available_count:    int   # 지금 신청 가능
    applied_count:      int   # 신청함
    completed_count:    int   # 수령 완료
    locked_count:       int   # 아직 잠김


# ── 헬퍼: 현재 임신 주차 계산 ─────────────────────────────────────────────────
def calc_pregnancy_week(due_date: date) -> int:
    days_left = (due_date - date.today()).days
    week = 40 - (days_left // 7)
    return max(0, min(40, week))


# ── 헬퍼: 혜택 status 결정 ────────────────────────────────────────────────────
def determine_status(benefit: Benefit, profile: Profile, user_benefit: Optional[UserBenefit]) -> tuple[str, Optional[str]]:
    # 이미 사용자가 상태 지정한 경우
    if user_benefit:
        return user_benefit.status, None

    today = date.today()
    is_pregnant = profile.birth_status == "pregnant"
    baby_date = profile.baby_date  # 예정일 or 생일

    # 임신 주차 계산 (임신 중인 경우)
    current_week = None
    if is_pregnant and profile.due_date:
        current_week = calc_pregnancy_week(profile.due_date)

    # applies_to 플래그 기반 잠금 (stage보다 정확 — anytime 등 포함)
    if is_pregnant and not benefit.applies_to_pregnant:
        return "locked", "출산 후 신청 가능해요"
    if not is_pregnant and not benefit.applies_to_born:
        return "locked", "임신 중에만 해당해요"

    # 임신 주차 기반 신청 가능 체크
    if is_pregnant and benefit.application_start_week is not None and current_week is not None:
        if current_week < benefit.application_start_week:
            remaining = benefit.application_start_week - current_week
            return "locked", f"{benefit.application_start_week}주차부터 신청 가능해요 ({remaining}주 후)"

    # 출산 후 N일 이내 체크
    if not is_pregnant and benefit.apply_within_days:
        days_since_birth = (today - baby_date).days
        if days_since_birth > benefit.apply_within_days:
            return "locked", f"신청 기한({benefit.apply_within_days}일)이 지났어요"
        elif days_since_birth > benefit.apply_within_days * 0.8:
            remaining_days = benefit.apply_within_days - days_since_birth
            return "available", f"신청 기한 {remaining_days}일 남았어요! 서두르세요"

    # 직업 조건 체크
    job = profile.job_status
    if job == "employed" and not benefit.applies_to_employed:
        return "locked", "직장인 해당 없음"
    if job == "self_employed" and not benefit.applies_to_self_employed:
        return "locked", "자영업자 해당 없음"
    if job == "unemployed" and not benefit.applies_to_unemployed:
        return "locked", "무직 해당 없음"

    # 지역 체크 (프론트 full name → short name 정규화)
    user_region = normalize_region(profile.region or "")
    if benefit.region != "전국" and benefit.region != user_region:
        return "locked", f"{benefit.region} 거주자만 해당해요"

    # 소득 조건 체크
    income_range = getattr(profile, "income_range", "unknown") or "unknown"
    if not income_qualifies(income_range, benefit.income_max_ratio):
        return "locked", "소득 기준 초과"
    if benefit.income_max_ratio and income_range == "unknown":
        return "available", "소득 조건 있음 — 확인 필요"

    # 신청 가능
    urgency = None
    if is_pregnant and benefit.application_start_week == 0:
        urgency = "지금 바로 신청하세요!"
    elif not is_pregnant and benefit.apply_within_days:
        days_since_birth = (today - baby_date).days
        remaining_days = benefit.apply_within_days - days_since_birth
        if remaining_days <= 30:
            urgency = f"신청 기한 {remaining_days}일 남았어요!"

    return "available", urgency


# ── GET /benefits/me ──────────────────────────────────────────────────────────
@router.get("/me", response_model=List[BenefitOut])
def get_my_benefits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="프로필을 먼저 설정해주세요.")

    benefits = db.query(Benefit).filter(Benefit.is_available == True).all()
    user_benefits_map = {
        ub.benefit_id: ub
        for ub in db.query(UserBenefit).filter(UserBenefit.user_id == current_user.id).all()
    }

    result = []
    for b in benefits:
        ub = user_benefits_map.get(b.id)
        status, urgency = determine_status(b, profile, ub)

        result.append(BenefitOut(
            id=b.id,
            name=b.name,
            category=b.category,
            region=b.region,
            stage=b.stage,
            amount_description=b.amount_description,
            payment_type=b.payment_type,
            representative_amount=calc_personalized_amount(b, profile),
            income_condition=b.income_condition,
            income_max_ratio=b.income_max_ratio,
            application_deadline=b.application_deadline,
            apply_within_days=b.apply_within_days,
            application_start_week=b.application_start_week,
            source_url=b.source_url,
            status=status,
            urgency_message=urgency,
        ))

    # 정렬: available 먼저, locked 마지막
    order = {"available": 0, "applied": 1, "completed": 2, "locked": 3}
    result.sort(key=lambda x: order.get(x.status, 9))
    return result


# ── GET /benefits/me/summary ──────────────────────────────────────────────────
@router.get("/me/summary", response_model=SummaryOut)
def get_my_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="프로필을 먼저 설정해주세요.")

    benefits = db.query(Benefit).filter(Benefit.is_available == True).all()
    user_benefits_map = {
        ub.benefit_id: ub
        for ub in db.query(UserBenefit).filter(UserBenefit.user_id == current_user.id).all()
    }

    confirmed_amount = conditional_amount = achieved_amount = remaining_amount = 0
    counts = {"available": 0, "applied": 0, "completed": 0, "locked": 0}

    for b in benefits:
        ub = user_benefits_map.get(b.id)
        status, _ = determine_status(b, profile, ub)
        amount = calc_personalized_amount(b, profile)
        has_income_cond = bool(b.income_max_ratio)

        if status != "locked":
            if has_income_cond:
                conditional_amount += amount
            else:
                confirmed_amount += amount

        if status in ("applied", "completed"):
            achieved_amount += amount
        elif status == "available":
            remaining_amount += amount

        counts[status] = counts.get(status, 0) + 1

    total_amount = confirmed_amount + conditional_amount
    # 달성률은 확정금액 기준 (100% 초과 가능)
    achievement_rate = round((achieved_amount / confirmed_amount * 100), 1) if confirmed_amount > 0 else 0.0

    return SummaryOut(
        total_amount=total_amount,
        confirmed_amount=confirmed_amount,
        conditional_amount=conditional_amount,
        achieved_amount=achieved_amount,
        remaining_amount=remaining_amount,
        achievement_rate=achievement_rate,
        total_count=len(benefits),
        available_count=counts["available"],
        applied_count=counts["applied"],
        completed_count=counts["completed"],
        locked_count=counts["locked"],
    )


# ── POST /benefits/{id}/apply ─────────────────────────────────────────────────
@router.post("/{benefit_id}/apply")
def apply_benefit(
    benefit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    benefit = db.query(Benefit).filter(Benefit.id == benefit_id).first()
    if not benefit:
        raise HTTPException(status_code=404, detail="혜택을 찾을 수 없습니다.")

    ub = db.query(UserBenefit).filter(
        UserBenefit.user_id == current_user.id,
        UserBenefit.benefit_id == benefit_id,
    ).first()

    if ub:
        ub.status = "applied"
        ub.applied_at = datetime.now(timezone.utc)
    else:
        ub = UserBenefit(
            user_id=current_user.id,
            benefit_id=benefit_id,
            status="applied",
            applied_at=datetime.now(timezone.utc),
        )
        db.add(ub)

    db.commit()
    return {"message": f"{benefit.name} 신청 완료로 표시했습니다."}


# ── POST /benefits/{id}/reset ────────────────────────────────────────────────
@router.post("/{benefit_id}/reset")
def reset_benefit(
    benefit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ub = db.query(UserBenefit).filter(
        UserBenefit.user_id == current_user.id,
        UserBenefit.benefit_id == benefit_id,
    ).first()
    if ub:
        db.delete(ub)
        db.commit()
    return {"message": "상태가 초기화되었습니다."}


# ── POST /benefits/{id}/complete ──────────────────────────────────────────────
@router.post("/{benefit_id}/complete")
def complete_benefit(
    benefit_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    benefit = db.query(Benefit).filter(Benefit.id == benefit_id).first()
    if not benefit:
        raise HTTPException(status_code=404, detail="혜택을 찾을 수 없습니다.")

    ub = db.query(UserBenefit).filter(
        UserBenefit.user_id == current_user.id,
        UserBenefit.benefit_id == benefit_id,
    ).first()

    if ub:
        ub.status = "completed"
    else:
        ub = UserBenefit(
            user_id=current_user.id,
            benefit_id=benefit_id,
            status="completed",
            applied_at=datetime.now(timezone.utc),
        )
        db.add(ub)

    db.commit()
    return {"message": f"{benefit.name} 수령 완료로 표시했습니다."}
