import type { Severity } from "@asaase/shared";

export type ThreatBand = "green" | "amber" | "red";

export type ThreatConfig = {
  label: string;
  color: string;
  bg: string;
  range: string; // severity range this band covers, for legend display
};

// Single source of truth for band color/label — components must read through this map rather
// than hardcoding a band's color or copy. PRD bands (ORCHESTRATOR_CONTRACT.md §8): Green 1-2,
// Amber 3, Red 4-5 — direct 1-5 severity mapping, no invented 0-100 threatScore/4-level scheme.
export const THREAT: Record<ThreatBand, ThreatConfig> = {
  green: { label: "Low", color: "var(--low)", bg: "var(--low-bg)", range: "1–2" },
  amber: { label: "Moderate", color: "var(--high)", bg: "var(--high-bg)", range: "3" },
  red: { label: "Critical", color: "var(--critical)", bg: "var(--critical-bg)", range: "4–5" },
};

export const bandFromSeverity = (severity: Severity): ThreatBand =>
  severity <= 2 ? "green" : severity === 3 ? "amber" : "red";
