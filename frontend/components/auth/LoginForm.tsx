"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* 로고 / 타이틀 */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🍼</div>
        <h1 className="text-3xl font-bold text-gray-800">아기 케어</h1>
        <p className="text-gray-400 mt-2 text-sm">소중한 아이의 성장을 기록하세요</p>
      </div>

      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-gray-700 placeholder-gray-400 transition"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent text-gray-700 placeholder-gray-400 transition"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* 구분선 */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-200" />
        <span className="px-4 text-gray-400 text-xs">또는</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* 소셜 로그인 (UI만, 추후 연결) */}
      <div className="space-y-3">
        <button
          type="button"
          disabled
          className="w-full py-3 flex items-center justify-center gap-3 border border-gray-200 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기 (준비 중)
        </button>

        <button
          type="button"
          disabled
          className="w-full py-3 flex items-center justify-center gap-3 border border-gray-200 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FEE500">
            <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.636 5.085 4.118 6.53L5.1 21l4.536-2.4A11.26 11.26 0 0012 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
          </svg>
          <span className="text-gray-400">카카오로 계속하기 (준비 중)</span>
        </button>
      </div>
    </div>
  );
}
