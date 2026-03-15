"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile } from "@/lib/profile";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    getMyProfile()
      .then((profile) => {
        if (!profile) {
          router.replace("/onboarding");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🍼</div>
        <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
        <p className="text-gray-400 mt-2">로그인 성공! 기능 개발 예정입니다.</p>
      </div>
    </main>
  );
}
