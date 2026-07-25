"use client";

import { useMemo } from "react";
import type { Alert, BlockageType } from "@asaase/shared";
import { THREAT, bandFromSeverity, type ThreatBand } from "@/data/threat";
import ThreatRing from "./ThreatRing";

const BANDS: ThreatBand[] = ["red", "amber", "green"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-4 w-1 rounded-none bg-gold" aria-hidden />
      <h2 className="font-display text-sm font-semibold text-forest">{children}</h2>
    </div>
  );
}

function dominantBlockage(breakdown: Alert["blockageBreakdown"]): BlockageType | null {
  const entries = Object.entries(breakdown) as [BlockageType, number][];
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

type ReportsPanelProps = {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
};

export default function ReportsPanel({ alerts, loading, error }: ReportsPanelProps) {
  // Metrics recomputed from live Alert[] fields (severity, scanCount, blockageBreakdown) — the
  // mock-only threatScore/verifiedReports/rawReports/floodThresholdMm fields have no PRD-backed
  // replacement and are cut (YAGNI, ORCHESTRATOR_CONTRACT.md §8).
  const metrics = useMemo(() => {
    const totalClusters = alerts.length;
    const criticalCount = alerts.filter((a) => bandFromSeverity(a.severity) === "red").length;
    const totalScans = alerts.reduce((sum, a) => sum + a.scanCount, 0);
    const avgSeverity =
      totalClusters > 0
        ? Math.round((alerts.reduce((sum, a) => sum + a.severity, 0) / totalClusters) * 10) / 10
        : 0;
    const bandBreakdown = BANDS.map((band) => ({
      band,
      count: alerts.filter((a) => bandFromSeverity(a.severity) === band).length,
    }));
    const worst =
      totalClusters > 0 ? alerts.reduce((a, b) => (b.severity > a.severity ? b : a)) : null;

    return { totalClusters, criticalCount, totalScans, avgSeverity, bandBreakdown, worst };
  }, [alerts]);

  const worstThreat = metrics.worst ? THREAT[bandFromSeverity(metrics.worst.severity)] : null;
  const worstDominant = metrics.worst ? dominantBlockage(metrics.worst.blockageBreakdown) : null;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-canvas px-5 py-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-forest">Risk clusters</h1>
        <p className="mt-0.5 text-sm text-text-secondary">Accra flood-defense network</p>
      </div>

      {loading && <p className="text-sm text-text-secondary">Loading live alerts…</p>}
      {!loading && error && (
        <div className="rounded-card border border-critical bg-critical-bg px-4 py-3 text-sm text-critical">
          Backend unreachable — {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Total clusters" value={metrics.totalClusters} />
            <MetricCard label="Critical" value={metrics.criticalCount} valueColor="var(--critical)" />
            <MetricCard label="Total scans" value={metrics.totalScans} />
            <MetricCard label="Avg severity" value={metrics.avgSeverity} />
          </div>

          {metrics.totalClusters === 0 ? (
            <p className="text-sm text-text-muted">No chokepoint clusters reported yet.</p>
          ) : (
            <>
              {/* Severity breakdown */}
              <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                <SectionTitle>Severity breakdown</SectionTitle>
                <div className="flex flex-col gap-3">
                  {metrics.bandBreakdown.map(({ band, count }) => {
                    const threat = THREAT[band];
                    const pct = Math.round((count / metrics.totalClusters) * 100);
                    return (
                      <div key={band}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-text-primary">
                            {threat.range} · {threat.label}
                          </span>
                          <span className="text-text-muted">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-pill bg-track">
                          <div
                            className="h-full rounded-pill"
                            style={{ width: `${pct}%`, background: threat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Worst cluster callout */}
              {metrics.worst && worstThreat && (
                <div
                  className="rounded-card border border-border bg-surface p-5 shadow-card"
                  style={{ borderLeft: `4px solid ${worstThreat.color}` }}
                >
                  <div className="mb-1 text-xs text-text-muted">Highest severity right now</div>
                  <div className="flex items-center gap-4">
                    <ThreatRing value={(metrics.worst.severity / 5) * 100} color={worstThreat.color} />
                    <div>
                      <div className="font-display text-base font-semibold text-text-primary">
                        Cluster {metrics.worst.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {worstThreat.label} · {metrics.worst.scanCount} scans
                        {worstDominant ? ` · ${worstDominant.replaceAll("_", " ")}` : ""}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div className="rounded-card bg-surface-sub p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div
        className="mt-1 font-display text-2xl font-semibold text-text-primary"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
    </div>
  );
}
