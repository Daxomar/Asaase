"use client";

import { useMemo, useState } from "react";
import { CloudRain } from "lucide-react";
import { clusters } from "@/data/clusters";
import { THREAT, type ThreatLevel } from "@/data/threat";
import ThreatRing from "./ThreatRing";

const LEVELS: ThreatLevel[] = [1, 2, 3, 4];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-4 w-1 rounded-none bg-gold" aria-hidden />
      <h2 className="font-display text-sm font-semibold text-forest">{children}</h2>
    </div>
  );
}

export default function ReportsPanel() {
  const [forecastMm, setForecastMm] = useState(20);

  const metrics = useMemo(() => {
    const totalClusters = clusters.length;
    const criticalCount = clusters.filter((c) => c.level === 1).length;
    const verifiedTotal = clusters.reduce((sum, c) => sum + c.verifiedReports, 0);
    const rawTotal = clusters.reduce((sum, c) => sum + c.rawReports, 0);
    const avgThreat = Math.round(
      clusters.reduce((sum, c) => sum + c.threatScore, 0) / totalClusters
    );
    const worst = clusters.reduce((a, b) => (a.threatScore > b.threatScore ? a : b));
    const levelBreakdown = LEVELS.map((level) => ({
      level,
      count: clusters.filter((c) => c.level === level).length,
    }));
    const rainfallWatch = clusters
      .filter((c) => c.floodThresholdMm <= forecastMm)
      .sort((a, b) => b.threatScore - a.threatScore);

    return {
      totalClusters,
      criticalCount,
      verifiedTotal,
      rawTotal,
      avgThreat,
      worst,
      levelBreakdown,
      rainfallWatch,
    };
  }, [forecastMm]);

  const worstThreat = THREAT[metrics.worst.level];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-canvas px-5 py-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-forest">Risk clusters</h1>
        <p className="mt-0.5 text-sm text-text-secondary">Accra flood-defense network</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total clusters" value={metrics.totalClusters} />
        <MetricCard
          label="Critical"
          value={metrics.criticalCount}
          valueColor="var(--critical)"
        />
        <MetricCard label="Verified reports" value={metrics.verifiedTotal} />
        <MetricCard label="Avg threat" value={metrics.avgThreat} />
      </div>

      {/* Dedup stat */}
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <SectionTitle>Deduplication</SectionTitle>
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">{metrics.rawTotal}</strong> raw reports →{" "}
          <strong className="text-text-primary">{metrics.totalClusters}</strong> clusters
          <span className="text-text-muted"> (100% actionable)</span>
        </p>
        <div className="mt-3 flex h-2 overflow-hidden rounded-pill bg-track">
          <div
            className="h-full bg-chart-neg"
            style={{
              width: `${Math.max(
                4,
                (metrics.totalClusters / metrics.rawTotal) * 100
              )}%`,
            }}
          />
          <div className="h-full flex-1 bg-chart-pos" />
        </div>
      </div>

      {/* Threat breakdown */}
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <SectionTitle>Threat breakdown</SectionTitle>
        <div className="flex flex-col gap-3">
          {metrics.levelBreakdown.map(({ level, count }) => {
            const threat = THREAT[level];
            const pct = Math.round((count / metrics.totalClusters) * 100);
            return (
              <div key={level}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-text-primary">
                    L{level} · {threat.label}
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

      {/* Rainfall watch */}
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <SectionTitle>Rainfall watch</SectionTitle>
        <div className="mb-3 flex items-center gap-2">
          <CloudRain size={16} strokeWidth={1.5} className="text-text-muted" />
          <label htmlFor="forecast" className="text-xs text-text-secondary">
            Forecast rainfall
          </label>
          <input
            id="forecast"
            type="number"
            min={0}
            max={200}
            value={forecastMm}
            onChange={(e) => setForecastMm(Number(e.target.value) || 0)}
            className="ml-auto w-16 rounded-control border border-border-strong bg-surface px-2 py-1 text-right text-xs text-text-primary"
          />
          <span className="text-xs text-text-muted">mm</span>
        </div>

        <p className="mb-3 text-sm text-text-secondary">
          <strong className="text-text-primary">{metrics.rainfallWatch.length}</strong>{" "}
          clusters flood if rain exceeds {forecastMm}mm.
        </p>

        <ul className="flex flex-col gap-2">
          {metrics.rainfallWatch.slice(0, 6).map((c) => {
            const threat = THREAT[c.level];
            return (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-control bg-surface-sub px-3 py-2 text-xs"
              >
                <span className="font-medium text-text-primary">{c.name}</span>
                <span
                  className="rounded-pill px-2 py-0.5 font-medium"
                  style={{ background: threat.bg, color: threat.color }}
                >
                  {Math.round(c.threatScore)}
                </span>
              </li>
            );
          })}
          {metrics.rainfallWatch.length === 0 && (
            <li className="text-xs text-text-muted">
              No clusters at risk under this forecast.
            </li>
          )}
        </ul>
      </div>

      {/* Worst cluster callout */}
      <div
        className="rounded-card border border-border bg-surface p-5 shadow-card"
        style={{ borderLeft: `4px solid ${worstThreat.color}` }}
      >
        <div className="mb-1 text-xs text-text-muted">Highest threat right now</div>
        <div className="flex items-center gap-4">
          <ThreatRing value={metrics.worst.threatScore} color={worstThreat.color} />
          <div>
            <div className="font-display text-base font-semibold text-text-primary">
              {metrics.worst.name}
            </div>
            <div className="text-xs text-text-secondary">
              {worstThreat.label} · {metrics.worst.blockageType}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs italic leading-relaxed text-text-secondary">
          {metrics.worst.aiSummary}
        </p>
      </div>
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
