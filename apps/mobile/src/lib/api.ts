// Thin fetch client for ORCHESTRATOR_CONTRACT.md §3 routes (gamification + scans). No mocks:
// every call hits the real backend; callers surface network/API failures instead of falling
// back to fake data.
import type { Scan, Severity, User } from "@asaase/shared";

// ponytail: EXPO_PUBLIC_ prefix is Expo's documented way to expose an env var to client code.
// Falls back to localhost:3001 (backend's default port, apps/backend/src/index.ts) for local dev.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {}

async function parseError(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
  throw new ApiError(body?.error?.message ?? `Request failed (${res.status})`);
}

export async function bootstrapDevice(deviceId: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceId }),
  });
  if (!res.ok) return parseError(res);
  return ((await res.json()) as { user: User }).user;
}

export async function fetchMe(deviceId: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/me`, { headers: { "X-Device-Id": deviceId } });
  if (!res.ok) return parseError(res);
  return ((await res.json()) as { user: User }).user;
}

export async function pingStreak(deviceId: string): Promise<{ streak: number; lastActivityAt: string }> {
  const res = await fetch(`${API_URL}/api/streak/ping`, {
    method: "POST",
    headers: { "X-Device-Id": deviceId },
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as { streak: number; lastActivityAt: string };
}

// POST /api/scans/analyze — ORCHESTRATOR_CONTRACT.md §3/§9: multipart/form-data (real file, not
// base64), per the contract's deliberate deviation. `photoUri` is a native file:// URI from
// expo-camera's takePictureAsync — RN's fetch/FormData accepts { uri, name, type } directly.
export async function analyzeScan(
  deviceId: string,
  photoUri: string,
  latitude: number,
  longitude: number,
): Promise<{ scan: Scan; cluster: { id: string; severity: Severity; created: boolean } }> {
  const form = new FormData();
  form.append("image", { uri: photoUri, name: "scan.jpg", type: "image/jpeg" } as unknown as Blob);
  form.append("latitude", String(latitude));
  form.append("longitude", String(longitude));

  // No Content-Type header — fetch sets the multipart boundary itself; overriding it manually
  // breaks the boundary on RN's fetch implementation.
  const res = await fetch(`${API_URL}/api/scans/analyze`, {
    method: "POST",
    headers: { "X-Device-Id": deviceId },
    // ponytail: RN fetch accepts FormData at runtime; SDK54 BodyInit_ typing is narrower
    body: form as unknown as RequestInit["body"],
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as { scan: Scan; cluster: { id: string; severity: Severity; created: boolean } };
}

export async function submitQuiz(
  deviceId: string,
  quizId: string,
  correct: boolean,
): Promise<{ xp: number; tokens: number; awarded: boolean }> {
  const res = await fetch(`${API_URL}/api/quiz/submit`, {
    method: "POST",
    headers: { "X-Device-Id": deviceId, "Content-Type": "application/json" },
    body: JSON.stringify({ quizId, correct }),
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as { xp: number; tokens: number; awarded: boolean };
}

// POST /api/marketplace/redeem — gamification.ts (T10) is authoritative on price + balance (one
// atomic conditional UPDATE, no read-then-write). `INSUFFICIENT_BALANCE` surfaces as a normal
// ApiError like any other rejection — callers branch on the message, no separate "blocked" return
// shape invented client-side.
export async function redeemReward(
  deviceId: string,
  rewardId: string,
  cost: number,
): Promise<{ tokens: number; redeemed: true }> {
  const res = await fetch(`${API_URL}/api/marketplace/redeem`, {
    method: "POST",
    headers: { "X-Device-Id": deviceId, "Content-Type": "application/json" },
    body: JSON.stringify({ rewardId, cost }),
  });
  if (!res.ok) return parseError(res);
  return (await res.json()) as { tokens: number; redeemed: true };
}
