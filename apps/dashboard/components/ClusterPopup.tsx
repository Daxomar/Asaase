import { Target, X } from "lucide-react";
import type { RiskCluster } from "@/data/clusters";
import { THREAT } from "@/data/threat";

const BLOCKAGE_LABEL: Record<RiskCluster["blockageType"], string> = {
  plastic: "Plastic",
  silt: "Silt",
  organic: "Organic",
  mixed: "Mixed",
};

type ClusterPopupProps = {
  cluster: RiskCluster;
  isIsolated: boolean;
  onToggleIsolate: () => void;
};

export default function ClusterPopup({
  cluster,
  isIsolated,
  onToggleIsolate,
}: ClusterPopupProps) {
  const threat = THREAT[cluster.level];

  return (
    <div className="w-60 font-body text-text-primary">
      <div className="px-4 pt-4">
        <div className="font-mono text-[11px] text-text-muted">{cluster.id}</div>
        <div className="font-display text-base font-semibold text-text-primary">
          {cluster.name}
        </div>

        <div
          className="mt-2 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium"
          style={{ background: threat.bg, color: threat.color }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: threat.color }}
            aria-hidden
          />
          Level {cluster.level} · {threat.label} · {Math.round(cluster.threatScore)}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
          <span className="rounded-pill bg-surface-sub px-2 py-0.5 font-medium">
            {BLOCKAGE_LABEL[cluster.blockageType]}
          </span>
          <span>Verified — {cluster.verifiedReports}</span>
        </div>

        <div className="mt-2 text-xs text-text-secondary">
          Floods if rain &gt; <strong>{cluster.floodThresholdMm}mm</strong>
        </div>

        <div className="mt-1 text-[11px] text-text-muted">
          {cluster.rawReports} raw reports → 1 cluster
        </div>
      </div>

      <div className="mx-4 my-3 rounded-control bg-surface-sub px-3 py-2.5 text-xs italic leading-relaxed text-text-secondary">
        {cluster.aiSummary}
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
        Updated {cluster.updated}
      </div>
    </div>
  );
}
