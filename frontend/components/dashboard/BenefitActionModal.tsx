"use client";

import { useState, useEffect, useRef } from "react";
import { BenefitItem, applyBenefit, completeBenefit, formatAmountFull } from "@/lib/benefits";

const CATEGORY_CONFIG: Record<string, { gradient: string; emoji: string; label: string }> = {
  medical: { gradient: "from-blue-500 to-cyan-500",     emoji: "🏥", label: "의료 지원" },
  cash:    { gradient: "from-violet-500 to-indigo-500", emoji: "💰", label: "현금 지원" },
  service: { gradient: "from-pink-500 to-rose-500",     emoji: "🤱", label: "서비스 지원" },
  leave:   { gradient: "from-emerald-500 to-teal-500",  emoji: "🏠", label: "휴직 지원" },
  tax:     { gradient: "from-amber-500 to-orange-400",  emoji: "📋", label: "세금 혜택" },
};
const DEFAULT_CAT = { gradient: "from-indigo-500 to-purple-600", emoji: "🎁", label: "혜택" };

const CONFETTI_COLORS = [
  "#f472b6","#818cf8","#34d399","#fbbf24","#60a5fa",
  "#f87171","#a78bfa","#4ade80","#fb923c","#38bdf8",
];

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: "rect" | "circle";
}

function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) return;
    const newPieces: ConfettiPiece[] = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 1.2,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 3500);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${p.x}%`,
            width: p.shape === "rect" ? p.size : p.size,
            height: p.shape === "rect" ? p.size * 0.5 : p.size,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  benefit: BenefitItem;
  onClose: () => void;
  onStatusChange: () => void;
}

export default function BenefitActionModal({ benefit, onClose, onStatusChange }: Props) {
  const [flipped, setFlipped]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [confetti, setConfetti]   = useState(false);

  const cat = CATEGORY_CONFIG[benefit.category] ?? DEFAULT_CAT;

  const act = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
      setConfetti(true);
      setTimeout(() => {
        onStatusChange();
        onClose();
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  /* ── 공통 뒤집기 버튼 (앞면/뒷면 동일 위치/디자인) ── */
  const FlipBtn = ({ targetFace }: { targetFace: boolean }) => (
    <button
      onClick={() => setFlipped(targetFace)}
      className="absolute top-4 right-12 w-8 h-8 rounded-full bg-white/25 border border-white/50
                 flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10"
      title={targetFace ? "뒷면 보기" : "앞면으로"}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );

  return (
    <>
      <Confetti active={confetti} />

      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* 홀로그래픽 테두리 래퍼 */}
        <div
          className="w-full max-w-sm rounded-3xl p-[2px]"
          style={{
            background: "linear-gradient(135deg, #818cf8, #f472b6, #34d399, #fbbf24, #818cf8)",
            backgroundSize: "300% 300%",
            animation: "card-shimmer 3s ease-in-out infinite",
          }}
        >
          {/* 3D 컨테이너 */}
          <div className="w-full" style={{ perspective: "1200px" }}>
            <div
              className="relative transition-transform duration-500 w-full"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                height: "540px",
              }}
            >

              {/* ══════════════ 앞면 ══════════════ */}
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col"
                style={{ backfaceVisibility: "hidden" }}
              >
                {/* 상단 그라데이션 */}
                <div className={`bg-gradient-to-br ${cat.gradient} px-6 pt-6 pb-5 flex-shrink-0 relative`}>
                  {/* 코너 장식 */}
                  <span className="absolute top-3 left-4 text-white/30 text-xs font-bold select-none">✦</span>
                  <span className="absolute bottom-3 right-4 text-white/30 text-xs font-bold select-none">✦</span>

                  {/* 닫기 + 뒤집기 */}
                  <FlipBtn targetFace={true} />
                  <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-xl leading-none z-10">✕</button>

                  {/* 카테고리 */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs font-bold text-white/70 tracking-widest uppercase">
                      {cat.emoji} {cat.label}
                    </span>
                  </div>

                  {/* 혜택명 */}
                  <h2 className="text-lg font-extrabold text-white leading-tight mb-4">
                    {benefit.name}
                  </h2>

                  {/* 금액 글로우 박스 */}
                  {benefit.representative_amount != null && benefit.representative_amount > 0 && (
                    <div className="relative bg-white/15 border border-white/30 rounded-2xl px-5 py-4 shadow-inner">
                      <p className="text-xs text-white/60 mb-1">내가 받을 금액</p>
                      <p className="text-3xl font-black text-white tracking-tight">
                        {formatAmountFull(benefit.representative_amount)}
                      </p>
                      <div className="absolute -inset-0.5 rounded-2xl bg-white/10 blur-md -z-10" />
                    </div>
                  )}
                </div>

                {/* 하단 흰 영역 */}
                <div className="bg-white flex-1 flex flex-col px-6 py-5 overflow-y-auto">
                  {/* 배지 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {benefit.region === "전국" && !benefit.income_max_ratio && (
                      <span className="bg-green-50 text-green-600 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                        ✅ 누구나 신청
                      </span>
                    )}
                    {benefit.region !== "전국" && (
                      <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                        📍 {benefit.region}
                      </span>
                    )}
                    {benefit.income_max_ratio && (
                      <span className="bg-orange-50 text-orange-500 text-xs font-semibold px-3 py-1 rounded-full border border-orange-200">
                        💡 소득 조건 있음
                      </span>
                    )}
                    {benefit.payment_type && (
                      <span className="bg-gray-50 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">
                        💳 {benefit.payment_type}
                      </span>
                    )}
                  </div>

                  {benefit.amount_description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">
                      {benefit.amount_description}
                    </p>
                  )}

                  {benefit.urgency_message && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5 mb-4">
                      <p className="text-xs font-semibold text-rose-500">⚡ {benefit.urgency_message}</p>
                    </div>
                  )}

                  <div className="flex-1" />

                  {/* 액션 */}
                  <div className="space-y-2 mt-2">
                    {benefit.status === "available" && (
                      <button
                        onClick={() => act(() => applyBenefit(benefit.id))}
                        disabled={loading}
                        className="w-full py-3 rounded-2xl bg-indigo-500 text-white text-sm font-extrabold hover:bg-indigo-600 disabled:opacity-40 transition-colors shadow-md"
                      >
                        {loading ? "처리 중..." : "✓ 신청 완료로 표시하기"}
                      </button>
                    )}
                    {benefit.status === "applied" && (
                      <button
                        onClick={() => act(() => completeBenefit(benefit.id))}
                        disabled={loading}
                        className="w-full py-3 rounded-2xl bg-green-500 text-white text-sm font-extrabold hover:bg-green-600 disabled:opacity-40 transition-colors shadow-md"
                      >
                        {loading ? "처리 중..." : "🎉 수령 완료로 표시하기"}
                      </button>
                    )}
                    {benefit.status === "completed" && (
                      <div className="w-full py-3 rounded-2xl bg-gray-100 text-gray-400 text-sm font-semibold text-center">
                        ✅ 이미 수령 완료
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════════════ 뒷면 ══════════════ */}
              <div
                className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {/* 뒷면 헤더 (동일 그라데이션) */}
                <div className={`bg-gradient-to-br ${cat.gradient} px-6 pt-6 pb-4 flex-shrink-0 relative`}>
                  {/* 코너 장식 */}
                  <span className="absolute top-3 left-4 text-white/30 text-xs font-bold select-none">✦</span>
                  <span className="absolute bottom-3 right-4 text-white/30 text-xs font-bold select-none">✦</span>

                  {/* 뒤집기 (앞면으로) + 닫기 — 동일 위치 */}
                  <FlipBtn targetFace={false} />
                  <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-xl leading-none z-10">✕</button>

                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">상세 정보</p>
                  <p className="text-sm font-bold text-white leading-snug">{benefit.name}</p>
                </div>

                {/* 뒷면 내용 — 다이아몬드 패턴 배경 */}
                <div
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
                  style={{
                    background: `
                      radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)
                    `,
                    backgroundSize: "24px 24px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  {benefit.amount_description && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">📋 혜택 내용</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{benefit.amount_description}</p>
                    </div>
                  )}

                  {benefit.application_deadline && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">🗓 신청 기한</p>
                      <p className="text-sm text-gray-700">{benefit.application_deadline}</p>
                    </div>
                  )}

                  {benefit.apply_within_days && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">⏰ 신청 기한</p>
                      <p className="text-sm text-gray-700">
                        출산 후 <span className="font-bold text-indigo-600">{benefit.apply_within_days}일</span> 이내
                      </p>
                    </div>
                  )}

                  {benefit.income_condition && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">💡 소득 조건</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{benefit.income_condition}</p>
                    </div>
                  )}

                  {benefit.payment_type && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">💳 지급 방식</p>
                      <p className="text-sm text-gray-700">{benefit.payment_type}</p>
                    </div>
                  )}

                  {benefit.urgency_message && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">⚡ 알림</p>
                      <p className="text-sm font-semibold text-rose-500">{benefit.urgency_message}</p>
                    </div>
                  )}
                </div>

                {/* 뒷면 하단 버튼 */}
                <div className="px-6 pb-6 pt-3 space-y-2 border-t border-gray-100 flex-shrink-0 bg-white">
                  {benefit.source_url && (
                    <a
                      href={benefit.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-semibold text-center hover:bg-gray-50 transition-colors"
                    >
                      공식 사이트 방문하기 →
                    </a>
                  )}
                  {benefit.status === "available" && (
                    <button
                      onClick={() => act(() => applyBenefit(benefit.id))}
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-indigo-500 text-white text-sm font-extrabold hover:bg-indigo-600 disabled:opacity-40 transition-colors shadow-md"
                    >
                      {loading ? "처리 중..." : "✓ 신청 완료로 표시하기"}
                    </button>
                  )}
                  {benefit.status === "applied" && (
                    <button
                      onClick={() => act(() => completeBenefit(benefit.id))}
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-green-500 text-white text-sm font-extrabold hover:bg-green-600 disabled:opacity-40 transition-colors shadow-md"
                    >
                      {loading ? "처리 중..." : "🎉 수령 완료로 표시하기"}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
