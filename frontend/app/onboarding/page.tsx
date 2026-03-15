"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileData, saveProfile } from "@/lib/profile";
import Step1Baby from "@/components/onboarding/Step1Baby";
import Step2Parent from "@/components/onboarding/Step2Parent";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await saveProfile(data as ProfileData);
      router.push("/dashboard");
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">
            {step === 1 ? "👶" : "🙋"}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {step === 1 ? "아기에 대해 알려주세요" : "부모님 정보를 알려주세요"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">맞춤 혜택을 찾아드릴게요</p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex justify-center gap-2 mb-8">
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? "bg-indigo-500" : "bg-indigo-200"}`} />
          <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? "bg-indigo-500" : "bg-gray-200"}`} />
        </div>

        {/* 에러 */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* 스텝 컨텐츠 */}
        {step === 1 ? (
          <Step1Baby
            data={data}
            onChange={setData}
            onNext={() => setStep(2)}
          />
        ) : (
          <Step2Parent
            data={data}
            onChange={setData}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </div>
    </main>
  );
}
