import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ProfileData {
  birth_status: "pregnant" | "born";
  baby_date: string;       // YYYY-MM-DD
  baby_count: "single" | "twins" | "triplets_plus";
  birth_order: "first" | "second_plus";
  region: string;
  job_status: "employed" | "self_employed" | "unemployed";
}

export async function saveProfile(data: ProfileData): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("프로필 저장 실패");
}

export async function getMyProfile(): Promise<ProfileData | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("프로필 조회 실패");
  return res.json();
}
