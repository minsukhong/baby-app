"use client";

import { ProfileData } from "@/lib/profile";

interface Props {
  data: Partial<ProfileData>;
  onChange: (data: Partial<ProfileData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
}

const SELECT_BASE = "flex-1 py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all";
const SELECT_ON  = "border-indigo-400 bg-indigo-50 text-indigo-700";
const SELECT_OFF = "border-gray-200 bg-white text-gray-500";

function ChoiceButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${SELECT_BASE} ${active ? SELECT_ON : SELECT_OFF}`}
    >
      {children}
    </button>
  );
}

const REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "경기도", "강원도", "충청북도", "충청남도",
  "전라북도", "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

export default function Step2Parent({ data, onChange, onBack, onSubmit, loading }: Props) {
  const isValid = data.region && data.job_status;

  return (
    <div className="space-y-7">
      {/* 지역 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-600">거주 지역</p>
        <select
          value={data.region || ""}
          onChange={(e) => onChange({ ...data, region: e.target.value })}
          className="w-full py-3 px-4 rounded-2xl border-2 border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 bg-white"
        >
          <option value="">📍 지역을 선택하세요</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* 직업 상태 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-600">직업 상태</p>
        <div className="flex gap-3">
          <ChoiceButton
            active={data.job_status === "employed"}
            onClick={() => onChange({ ...data, job_status: "employed" })}
          >
            👔 직장인
          </ChoiceButton>
          <ChoiceButton
            active={data.job_status === "self_employed"}
            onClick={() => onChange({ ...data, job_status: "self_employed" })}
          >
            🧾 자영업
          </ChoiceButton>
        </div>
        <div className="flex">
          <ChoiceButton
            active={data.job_status === "unemployed"}
            onClick={() => onChange({ ...data, job_status: "unemployed" })}
          >
            무직
          </ChoiceButton>
          <div className="flex-1" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-4 px-6 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          ← 이전
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || loading}
          className="flex-1 py-4 rounded-2xl bg-indigo-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
        >
          {loading ? "저장 중..." : "완료"}
        </button>
      </div>
    </div>
  );
}
