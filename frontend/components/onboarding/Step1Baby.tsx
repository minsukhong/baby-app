"use client";

import { ProfileData } from "@/lib/profile";

interface Props {
  data: Partial<ProfileData>;
  onChange: (data: Partial<ProfileData>) => void;
  onNext: () => void;
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

export default function Step1Baby({ data, onChange, onNext }: Props) {
  const isValid =
    data.birth_status && data.baby_date && data.baby_count && data.birth_order;

  return (
    <div className="space-y-7">
      {/* 출산 상태 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-600">출산 상태</p>
        <div className="flex gap-3">
          <ChoiceButton
            active={data.birth_status === "pregnant"}
            onClick={() => onChange({ ...data, birth_status: "pregnant" })}
          >
            🤰 임신중
          </ChoiceButton>
          <ChoiceButton
            active={data.birth_status === "born"}
            onClick={() => onChange({ ...data, birth_status: "born" })}
          >
            👶 출산함
          </ChoiceButton>
        </div>
      </div>

      {/* 날짜 */}
      {data.birth_status && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600">
            {data.birth_status === "pregnant" ? "출산 예정일" : "아기 생년월일"}
          </p>
          <input
            type="date"
            value={data.baby_date || ""}
            onChange={(e) => onChange({ ...data, baby_date: e.target.value })}
            className="w-full py-3 px-4 rounded-2xl border-2 border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-indigo-400"
          />
        </div>
      )}

      {/* 아기 수 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-600">아기가 몇 명이에요?</p>
        <div className="flex gap-3">
          <ChoiceButton
            active={data.baby_count === "single"}
            onClick={() => onChange({ ...data, baby_count: "single" })}
          >
            1명
          </ChoiceButton>
          <ChoiceButton
            active={data.baby_count === "twins"}
            onClick={() => onChange({ ...data, baby_count: "twins" })}
          >
            쌍둥이
          </ChoiceButton>
          <ChoiceButton
            active={data.baby_count === "triplets_plus"}
            onClick={() => onChange({ ...data, baby_count: "triplets_plus" })}
          >
            3명↑
          </ChoiceButton>
        </div>
      </div>

      {/* 출생 순서 */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-600">첫째예요, 둘째 이상이에요?</p>
        <div className="flex gap-3">
          <ChoiceButton
            active={data.birth_order === "first"}
            onClick={() => onChange({ ...data, birth_order: "first" })}
          >
            첫째
          </ChoiceButton>
          <ChoiceButton
            active={data.birth_order === "second_plus"}
            onClick={() => onChange({ ...data, birth_order: "second_plus" })}
          >
            둘째 이상
          </ChoiceButton>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
      >
        다음 →
      </button>
    </div>
  );
}
