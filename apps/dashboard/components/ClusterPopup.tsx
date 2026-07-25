import { Target, X } from "lucide-react";
import type { Alert, BlockageType } from "@asaase/shared";
import { THREAT, bandFromSeverity } from "@/data/threat";

// PRD FEAT-005 enum (ORCHESTRATOR_CONTRACT.md §1/§8) — real values, not the retired mock's
// plastic/silt/organic/mixed.
const BLOCKAGE_LABEL: Record<BlockageType, string> = {
  sachet_water_rubbers: "Sachet & rubber",
  pet_bottles: "PET bottles",
  silt_sand: "Silt & sand",
  overgrown_weeds: "Overgrown weeds",
};

type ClusterPopupProps = {
  alert: Alert;
  isIsolated: boolean;
  onToggleIsolate: () => void;
};

// Highest-share blockage type from the breakdown — Alert has no single `blockageType` field
// (that was mock-only), so the dominant type is derived from the live percentage breakdown.
function dominantBlockage(breakdown: Alert["blockageBreakdown"]): BlockageType | null {
  const entries = Object.entries(breakdown) as [BlockageType, number][];
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export default function ClusterPopup({ alert, isIsolated, onToggleIsolate }: ClusterPopupProps) {
  const band = bandFromSeverity(alert.severity);
  const threat = THREAT[band];
  const dominant = dominantBlockage(alert.blockageBreakdown);

  return (
    <div className="w-60 font-body text-text-primary">
      <div className="px-4 pt-4">
        <div className="font-mono text-[11px] text-text-muted">{alert.id.slice(0, 8)}</div>
        <div className="font-display text-base font-semibold text-text-primary">
          Chokepoint cluster
        </div>

        <div
          className="mt-2 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium"
          style={{ background: threat.bg, color: threat.color }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: threat.color }} aria-hidden />
          Severity {alert.severity} · {threat.label}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          {dominant && (
            <span className="rounded-pill bg-surface-sub px-2 py-0.5 font-medium">
              {BLOCKAGE_LABEL[dominant]}
            </span>
          )}
          <span>{alert.scanCount} scans</span>
        </div>
      </div>

      <div className="mx-4 my-3 flex flex-col gap-1.5">
        {(Object.entries(alert.blockageBreakdown) as [BlockageType, number][])
          .filter(([, pct]) => pct > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([type, pct]) => (
            <div key={type} className="flex items-center justify-between text-[11px] text-text-secondary">
              <span>{BLOCKAGE_LABEL[type]}</span>
              <span className="font-medium text-text-primary">{pct}%</span>
            </div>
          ))}
      </div>

      {/* T17 wires the live brief here: streamClusterSummary(alert.id, onChunk) from lib/api.ts,
          appending chunks into local state as they arrive (A-15). Static mock aiSummary retired. */}

      <div className="px-4">
        <button
          type="button"
          onClick={onToggleIsolate}
          className="flex w-full items-center justify-center gap-1.5 rounded-control border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-sub"
        >
          {isIsolated ? (
            <>
              <X size={13} strokeWidth={1.5} />
              Show all clusters
            </>
          ) : (
            <>
              <Target size={13} strokeWidth={1.5} />
              Isolate this cluster
            </>
          )}
        </button>
      </div>

      <div className="border-t border-border mt-3 px-4 py-2 text-[11px] text-text-muted">
        Updated {new Date(alert.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
