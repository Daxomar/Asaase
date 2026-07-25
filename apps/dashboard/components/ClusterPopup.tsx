import { AlertTriangle, Loader2, Sparkles, Target, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Alert, BlockageType } from "@asaase/shared";
import { THREAT, bandFromSeverity } from "@/data/threat";
import { streamClusterSummary } from "@/lib/api";

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

type BriefStatus = "loading" | "streaming" | "done" | "error";

export default function ClusterPopup({ alert, isIsolated, onToggleIsolate }: ClusterPopupProps) {
  const band = bandFromSeverity(alert.severity);
  const threat = THREAT[band];
  const dominant = dominantBlockage(alert.blockageBreakdown);

  const [brief, setBrief] = useState("");
  const [briefStatus, setBriefStatus] = useState<BriefStatus>("loading");
  const [briefError, setBriefError] = useState<string | null>(null);

  // ponytail: no `isOpen` prop to gate this — react-leaflet's Popup only portals `children`
  // into the DOM once Leaflet creates the popup's content node, which happens exactly on
  // marker click (see @react-leaflet/core div-overlay.js: `contentNode ? createPortal(...) :
  // null`). So this component mounting IS the "cluster click" trigger (A-15). No reset-state
  // calls at the top of the effect (mirrors useAlerts in lib/api.ts) — initial useState values
  // are already "loading"/""/null, and RiskMap keys each popup's subtree by `alert.id`, so a
  // changed id remounts fresh rather than reusing this instance.
  useEffect(() => {
    let cancelled = false;

    streamClusterSummary(alert.id, (chunk) => {
      if (cancelled) return;
      setBriefStatus("streaming");
      setBrief((prev) => prev + chunk);
    })
      .then(() => {
        if (!cancelled) setBriefStatus("done");
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setBriefStatus("error");
          setBriefError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [alert.id]);

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

      <div className="mx-4 mb-3 rounded-control border border-border bg-surface-sub px-3 py-2.5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-forest">
          <Sparkles size={12} strokeWidth={1.75} />
          Clearance brief
          {briefStatus === "loading" && (
            <Loader2 size={12} strokeWidth={2} className="ml-auto animate-spin text-text-muted" />
          )}
        </div>

        {briefStatus === "error" ? (
          <div className="flex items-start gap-1.5 text-xs text-critical">
            <AlertTriangle size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            <span>{briefError}</span>
          </div>
        ) : briefStatus === "loading" ? (
          <p className="text-xs text-text-muted">Generating live brief…</p>
        ) : (
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">
            {brief}
            {briefStatus === "streaming" && (
              <span
                className="ml-0.5 inline-block h-3 w-1 translate-y-0.5 animate-pulse bg-gold align-middle"
                aria-hidden
              />
            )}
          </p>
        )}
      </div>

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
