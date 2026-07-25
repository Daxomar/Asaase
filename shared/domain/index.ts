// Canonical domain types shared across backend, mobile, and dashboard.
// Backend derives Drizzle rows into these at the API boundary — no app sees raw DB row shapes.
// Per ORCHESTRATOR_CONTRACT.md §1. No app re-declares its own conflicting version (A-01).

export type BlockageType =
  | "sachet_water_rubbers"
  | "pet_bottles"
  | "silt_sand"
  | "overgrown_weeds";

export type Severity = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string; // uuid, server-generated
  deviceId: string; // client-generated uuid, unique, the auth anchor
  streak: number;
  xp: number;
  tokens: number;
  lastActivityAt: string | null; // ISO, GMT — drives streak calc
  createdAt: string;
}

export interface Scan {
  id: string;
  userId: string;
  imageUrl: string; // stored path/URL, not base64
  latitude: number;
  longitude: number;
  blockageType: BlockageType;
  confidence: number; // 0-1
  severity: Severity;
  clusterId: string;
  createdAt: string;
}

export interface ChokepointCluster {
  id: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  scanCount: number;
  summaryText: string | null; // last cached LLM brief, nullable
  createdAt: string;
  updatedAt: string;
}

// Read-shape returned by GET /api/v1/alerts/summary — cluster + derived breakdown.
export interface Alert {
  id: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  scanCount: number;
  blockageBreakdown: Record<BlockageType, number>; // percentages, sum ~100
  updatedAt: string;
}
