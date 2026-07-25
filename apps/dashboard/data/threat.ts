export type ThreatLevel = 1 | 2 | 3 | 4; // 1 = Critical … 4 = Low

export type ThreatConfig = {
  label: string;
  color: string;
  bg: string;
  scoreRange: string;
};

// Single source of truth for threat color/label — components must read
// through this map rather than hardcoding a level's color or copy.
export const THREAT: Record<ThreatLevel, ThreatConfig> = {
  1: { label: "Critical", color: "var(--critical)", bg: "var(--critical-bg)", scoreRange: "80–100" },
  2: { label: "High", color: "var(--high)", bg: "var(--high-bg)", scoreRange: "60–79" },
  3: { label: "Moderate", color: "var(--moderate)", bg: "var(--moderate-bg)", scoreRange: "40–59" },
  4: { label: "Low", color: "var(--low)", bg: "var(--low-bg)", scoreRange: "0–39" },
};

export const levelFromScore = (s: number): ThreatLevel =>
  s >= 80 ? 1 : s >= 60 ? 2 : s >= 40 ? 3 : 4;
