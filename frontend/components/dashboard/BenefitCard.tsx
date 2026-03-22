"use client";

import { useState } from "react";
import { BenefitItem, completeBenefit, resetBenefit, formatAmount } from "@/lib/benefits";
import BenefitActionModal from "./BenefitActionModal";

const STATUS_BADGE: Record<string, string> = {
  available: "bg-indigo-100 text-indigo-700",
  applied:   "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  locked:    "bg-gray-100 text-gray-400",
};

interface Props {
  benefit: BenefitItem;
  onStatusChange: () => void;
}

export default function BenefitCard({ benefit, onStatusChange }: Props) {
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);

  const isLocked = benefit.status === "locked";

  const act = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); onStatusChange(); } finally { setLoading(false); }
  };

  return (
    <>
      {showModal && (
        <BenefitActionModal
          benefit={benefit}
          onClose={() => setShowModal(false)}
          onStatusChange={() => { setShowModal(false); onStatusChange(); }}
        />
      )}

      <div className={`rounded-2xl border-2 p-4 transition-all ${
        isLocked ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-100 bg-white shadow-sm"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* 혜택명 + 배지 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">{benefit.name}</span>
              {benefit.region === "전국" && !benefit.income_max_ratio && (
                <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full">누구나 신청</span>
              )}
              {benefit.region !== "전국" && (
                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{benefit.region}</span>
              )}
              {benefit.income_max_ratio && (
                <span className="bg-orange-50 text-orange-500 text-xs px-2 py-0.5 rounded-full">소득조건</span>
              )}
            </div>

            {/* 금액 */}
            {benefit.representative_amount != null && benefit.representative_amount > 0 && (
              <p className="text-base font-bold text-indigo-600 mt-1">
                {formatAmount(benefit.representative_amount)}
              </p>
            )}

            {/* 금액 상세 */}
            {benefit.amount_description && (
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                {benefit.amount_description}
              </p>
            )}

            {/* 긴급/잠금 메시지 */}
            {benefit.urgency_message && (
              <p className={`text-xs font-medium mt-1 ${
                benefit.status === "locked" ? "text-gray-400" : "text-rose-500"
              }`}>
                {benefit.status === "locked" ? "🔒 " : "⚡ "}{benefit.urgency_message}
              </p>
            )}
          </div>

          {/* 상태 배지 */}
          <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_BADGE[benefit.status]}`}>
            {benefit.status === "available"  && "신청가능"}
            {benefit.status === "applied"    && "신청함"}
            {benefit.status === "completed"  && "완료"}
            {benefit.status === "locked"     && "잠김"}
          </span>
        </div>

        {/* 액션 버튼 */}
        {!isLocked && (
          <div className="flex gap-2 mt-3">
            {benefit.status === "available" && (
              <>
                {benefit.source_url && (
                  <a
                    href={benefit.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-500 text-center hover:bg-gray-50 transition-colors"
                  >
                    공식 사이트 →
                  </a>
                )}
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
                >
                  신청했어요 ✓
                </button>
              </>
            )}
            {benefit.status === "applied" && (
              <>
                <button
                  onClick={() => act(() => resetBenefit(benefit.id))}
                  disabled={loading}
                  className="py-2 px-3 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 disabled:opacity-40 transition-colors"
                >
                  수령 완료 ✓
                </button>
              </>
            )}
            {benefit.status === "completed" && (
              <>
                <button
                  onClick={() => act(() => resetBenefit(benefit.id))}
                  disabled={loading}
                  className="py-2 px-3 rounded-xl border-2 border-gray-200 text-xs font-medium text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  완료 취소
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex-1 py-2 rounded-xl border-2 border-indigo-200 text-indigo-500 text-xs font-semibold hover:bg-indigo-50 transition-colors"
                >
                  상세 보기
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
