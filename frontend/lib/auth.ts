const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "로그인에 실패했습니다.");
  }

  const data = await res.json();
  localStorage.setItem("access_token", data.access_token);
  return data.access_token;
}

export function logout() {
  localStorage.removeItem("access_token");
}

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}
