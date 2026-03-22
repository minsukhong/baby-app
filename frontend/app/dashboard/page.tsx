"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getToken, logout } from "@/lib/auth";
import { getMyProfile, ProfileData } from "@/lib/profile";
import { getMyBenefits, getMySummary, formatAmount, formatAmountFull, BenefitItem, BenefitSummary } from "@/lib/benefits";
import BenefitCard from "@/components/dashboard/BenefitCard";
import ProfileModal from "@/components/dashboard/ProfileModal";

// 출산 전/후 stage 분류 (anytime은 출산 후 — 아동수당 등 출생 후 신청)
const PRE_STAGES  = new Set(["pregnancy"]);
const POST_STAGES = new Set(["birth", "infant", "toddler", "child", "anytime"]);

const STATUS_ORDER = ["available", "applied", "completed", "locked"] as const;
const STATUS_LABEL: Record<string, string> = {
  available: "🔔 신청 가능",
  applied:   "⏳ 신청함",
  completed: "✅ 수령 완료",
  locked:    "🔒 아직 해당 없음",
};

function sortBenefits(items: BenefitItem[]): BenefitItem[] {
  return [...items].sort((a, b) => {
    // 소득조건 있는 건 맨 뒤
    if (a.income_max_ratio && !b.income_max_ratio) return 1;
    if (!a.income_max_ratio && b.income_max_ratio) return -1;
    // 나머지는 금액 내림차순
    return (b.representative_amount ?? 0) - (a.representative_amount ?? 0);
  });
}

function BenefitSection({ title, items, onStatusChange }: {
  title: string;
  items: BenefitItem[];
  onStatusChange: () => void;
}) {
  if (!items.length) return null;

  // 상태별로 묶기 + 정렬
  const grouped = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = sortBenefits(items.filter((b) => b.status === s));
    return acc;
  }, {} as Record<string, BenefitItem[]>);

  return (
    <div className="space-y-5">
      {STATUS_ORDER.map((status) => {
        const list = grouped[status];
        if (!list?.length) return null;
        return (
          <div key={status}>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              {STATUS_LABEL[status]}
              <span className="ml-1 font-normal text-gray-400">{list.length}개</span>
            </p>
            <div className="space-y-3">
              {list.map((b) => (
                <BenefitCard key={b.id} benefit={b} onStatusChange={onStatusChange} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [benefits, setBenefits]   = useState<BenefitItem[]>([]);
  const [summary, setSummary]     = useState<BenefitSummary | null>(null);
  const [profile, setProfile]     = useState<ProfileData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, s, p] = await Promise.all([getMyBenefits(), getMySummary(), getMyProfile()]);
      setBenefits(b);
      setSummary(s);
      setProfile(p);
    } catch {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }
    getMyProfile()
      .then((p) => { if (!p) router.replace("/onboarding"); else load(); })
      .catch(() => router.replace("/login"));
  }, [router, load]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">혜택 계산 중...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </main>
    );
  }

  const preBenefits  = benefits.filter((b) => PRE_STAGES.has(b.stage ?? ""));
  const postBenefits = benefits.filter((b) => POST_STAGES.has(b.stage ?? ""));
  const rate = summary?.achievement_rate ?? 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {showProfile && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSaved={() => { setLoading(true); load(); }}
        />
      )}
      {/* 상단 요약 카드 */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-5 pt-10 pb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs opacity-70 mb-1">최대 받을 수 있는 혜택 (잠금 포함)</p>

            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-3xl font-bold">
                {summary ? formatAmountFull(summary.total_all_amount) : "-"}
              </p>
              {summary && summary.conditional_amount > 0 && (
                <p className="text-base font-semibold opacity-75">
                  +α {formatAmount(summary.conditional_amount)}
                </p>
              )}
            </div>
            {summary && (
              <p className="text-xs opacity-60 mt-0.5">
                지금 신청 가능 {formatAmount(summary.confirmed_amount)}
                {summary.locked_amount > 0 && ` · 잠김 ${formatAmount(summary.locked_amount)}`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="text-xs bg-white/30 hover:bg-white/40 border border-white/50 px-3 py-1.5 rounded-xl transition-colors font-medium"
            >
              👤 내 프로필
            </button>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              className="text-xs opacity-60 hover:opacity-100"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 진행률 바 */}
        {summary && (() => {
          const totalAll   = summary.total_all_amount || 1;
          const unlockedPct = Math.min(((summary.confirmed_amount + summary.conditional_amount) / totalAll) * 100, 100);
          const achievedPct = Math.min((summary.achieved_amount / totalAll) * 100, unlockedPct);
          return (
            <div className="space-y-2">
              <div className="flex justify-between text-xs opacity-80">
                <span>
                  {rate > 100 ? "🎉 달성 초과!" : `달성률 ${rate}%`}
                  <span className="opacity-60 ml-1">· 잠금해제 {Math.round(unlockedPct)}%</span>
                </span>
                <span>신청완료 {formatAmount(summary.achieved_amount)}</span>
              </div>
              {/* 3단계 바: 잠김(dim) → 잠금해제(medium) → 달성(bright) */}
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden relative">
                {/* 잠금해제 구간 (white/50) */}
                <div
                  className="absolute left-0 top-0 h-full bg-white/50 rounded-full transition-all duration-700"
                  style={{ width: `${unlockedPct}%` }}
                />
                {/* 달성 구간 (solid white or yellow) */}
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${rate > 100 ? "bg-yellow-300" : "bg-white"}`}
                  style={{ width: `${achievedPct}%` }}
                />
              </div>
              <div className="flex gap-2 text-xs opacity-60 mt-0.5">
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-white" />달성</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-white/50" />신청가능</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-white/20" />잠김</span>
              </div>
            </div>
          );
        })()}

        {/* 카운트 요약 */}
        <div className="flex gap-4 mt-4 text-center">
          {[
            { label: "신청가능", count: summary?.available_count, color: "text-yellow-300" },
            { label: "신청함",   count: summary?.applied_count,   color: "text-blue-200" },
            { label: "완료",     count: summary?.completed_count, color: "text-green-300" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex-1 bg-white/10 rounded-2xl py-2">
              <p className={`text-lg font-bold ${color}`}>{count ?? 0}</p>
              <p className="text-xs opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 타임라인 + 혜택 목록 */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-2">

        {/* 출산 전 */}
        {preBenefits.length > 0 && (
          <div>
            {/* 타임라인 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">출산 전</p>
                <p className="text-xs text-gray-400">임신 중 받을 수 있는 혜택</p>
              </div>
              <span className="ml-auto text-xs text-indigo-500 font-semibold bg-indigo-50 px-2 py-1 rounded-full">
                {preBenefits.filter(b => b.status !== "locked").length}개 해당
              </span>
            </div>
            <div className="ml-4 pl-7 border-l-2 border-indigo-100 pb-6">
              <BenefitSection title="출산 전" items={preBenefits} onStatusChange={load} />
            </div>
          </div>
        )}

        {/* 출산 후 */}
        {postBenefits.length > 0 && (
          <div>
            {/* 타임라인 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">출산 후</p>
                <p className="text-xs text-gray-400">출산 후 신청할 수 있는 혜택</p>
              </div>
              <span className="ml-auto text-xs text-purple-500 font-semibold bg-purple-50 px-2 py-1 rounded-full">
                {postBenefits.filter(b => b.status !== "locked").length}개 해당
              </span>
            </div>
            <div className="ml-4 pl-7 border-l-2 border-purple-100 pb-6">
              <BenefitSection title="출산 후" items={postBenefits} onStatusChange={load} />
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
