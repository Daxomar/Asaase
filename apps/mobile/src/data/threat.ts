import type { Severity } from "@asaase/shared";

export type ThreatBand = "green" | "amber" | "red";

// Mirrors apps/dashboard/data/threat.ts - same PRD bands (green 1-2, amber 3, red 4-5),
// same product family across mobile + dashboard, not a from-scratch mobile scale.
export const THREAT: Record<ThreatBand, { label: string; color: string; bg: string }> = {
  green: { label: "Low", color: "#1e8a46", bg: "#E3F1E7" },
  amber: { label: "Moderate", color: "#d9ac39", bg: "#FAF0D6" },
  red: { label: "Critical", color: "#b8382f", bg: "#F6E4E1" },
};

export const bandFromSeverity = (severity: Severity): ThreatBand =>
  severity <= 2 ? "green" : severity === 3 ? "amber" : "red";
