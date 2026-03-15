"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <div className="text-5xl mb-3">🍼</div>
        <CardTitle className="text-3xl font-bold text-gray-800">아기 케어</CardTitle>
        <CardDescription className="text-gray-400 text-sm">소중한 아이의 성장을 기록하세요</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-gray-600 text-sm">아이디</Label>
            <Input
              id="username"
              type="text"
              placeholder="아이디를 입력하세요"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:ring-indigo-300"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-gray-600 text-sm">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 rounded-xl bg-gray-50 border-gray-200 focus:ring-indigo-300"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-semibold text-white"
          >
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-gray-400 text-xs">또는</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* 소셜 로그인 (UI만, 추후 연결) */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            disabled
            className="w-full h-11 rounded-xl border-gray-200 text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기 (준비 중)
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled
            className="w-full h-11 rounded-xl border-gray-200 text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#FEE500">
              <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.636 5.085 4.118 6.53L5.1 21l4.536-2.4A11.26 11.26 0 0012 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3z"/>
            </svg>
            카카오로 계속하기 (준비 중)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
