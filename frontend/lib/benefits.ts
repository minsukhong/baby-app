import { apiFetch } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface BenefitItem {
  id:                     string;
  name:                   string;
  category:               string;
  region:                 string;
  stage:                  string | null;
  amount_description:     string | null;
  payment_type:           string | null;
  representative_amount:  number | null;
  income_condition:       string | null;
  income_max_ratio:       number | null;
  application_deadline:   string | null;
  apply_within_days:      number | null;
  application_start_week: number | null;
  source_url:             string | null;
  status:                 "locked" | "available" | "applied" | "completed";
  urgency_message:        string | null;
}

export interface BenefitSummary {
  total_amount:        number;
  total_all_amount:    number;
  confirmed_amount:    number;
  conditional_amount:  number;
  locked_amount:       number;
  achieved_amount:     number;
  remaining_amount:    number;
  achievement_rate:    number;
  total_count:         number;
  available_count:     number;
  applied_count:       number;
  completed_count:     number;
  locked_count:        number;
}

export async function getMyBenefits(): Promise<BenefitItem[]> {
  const res = await apiFetch(`${API_URL}/benefits/me`);
  if (!res.ok) throw new Error("혜택 조회 실패");
  return res.json();
}

export async function getMySummary(): Promise<BenefitSummary> {
  const res = await apiFetch(`${API_URL}/benefits/me/summary`);
  if (!res.ok) throw new Error("요약 조회 실패");
  return res.json();
}

export async function applyBenefit(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/benefits/${id}/apply`, { method: "POST" });
  if (!res.ok) throw new Error("신청 처리 실패");
}

export async function completeBenefit(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/benefits/${id}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("완료 처리 실패");
}

export async function resetBenefit(id: string): Promise<void> {
  const res = await apiFetch(`${API_URL}/benefits/${id}/reset`, { method: "POST" });
  if (!res.ok) throw new Error("취소 처리 실패");
}

// 헤더용: 정확한 금액 (10,850,000원)
export function formatAmountFull(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// 카드/서브용: 압축 표기 (1,085만원) — 정수면 .0 제거
export function formatAmount(amount: number): string {
  if (amount >= 10_000_000) return `${(amount / 10_000).toLocaleString("ko-KR")}만원`;
  if (amount >= 1_000_000)  return `${(amount / 10_000).toFixed(0)}만원`;
  if (amount >= 10_000) {
    const man = amount / 10_000;
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}
