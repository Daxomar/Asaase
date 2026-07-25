"use client";

import { Fragment, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Alert } from "@asaase/shared";
import { THREAT, bandFromSeverity, type ThreatBand } from "@/data/threat";
import ClusterPopup from "./ClusterPopup";

const BANDS: ThreatBand[] = ["red", "amber", "green"];

// Distinct pin per cluster center so overlapping radius zones stay
// separable — the translucent Circle fill alone can't tell them apart.
function clusterIcon(color: string, selected: boolean) {
  return L.divIcon({
    className: "cluster-marker",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid var(--surface);box-shadow:${
      selected
        ? "0 0 0 3px var(--gold), 0 2px 6px rgba(0,0,0,.3)"
        : "0 1px 4px rgba(0,0,0,.3)"
    };"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Alert has no PostGIS buffer radius (that was mock-only, T16 retires it) — scale a fixed
// marker radius from report density instead, clamped to a readable map range.
const radiusFromScanCount = (scanCount: number) => Math.min(1000, 250 + scanCount * 40);

type RiskMapProps = {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
};

export default function RiskMap({ alerts, loading, error }: RiskMapProps) {
  const [isolatedId, setIsolatedId] = useState<string | null>(null);

  const isolatedAlert = alerts.find((a) => a.id === isolatedId) ?? null;
  const visibleAlerts = isolatedAlert ? [isolatedAlert] : alerts;

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[5.6, -0.19]} zoom={11} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleAlerts.map((alert) => {
          const band = bandFromSeverity(alert.severity);
          const threat = THREAT[band];
          const isSelected = alert.id === isolatedId;

          return (
            <Fragment key={alert.id}>
              <Circle
                center={[alert.latitude, alert.longitude]}
                radius={radiusFromScanCount(alert.scanCount)}
                pathOptions={{
                  color: threat.color,
                  fillColor: threat.color,
                  fillOpacity: isSelected ? 0.18 : 0.35,
                  weight: 1.5,
                  className: band === "red" && !isolatedId ? "cluster-pulse" : undefined,
                }}
              >
                <Tooltip direction="top">
                  Severity {alert.severity} · {alert.scanCount} scans
                </Tooltip>
              </Circle>

              <Marker
                position={[alert.latitude, alert.longitude]}
                icon={clusterIcon(threat.color, isSelected)}
              >
                <Popup>
                  <ClusterPopup
                    alert={alert}
                    isIsolated={isSelected}
                    onToggleIsolate={() =>
                      setIsolatedId((prev) => (prev === alert.id ? null : alert.id))
                    }
                  />
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>

      {isolatedAlert && (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary shadow-float">
          <span>Isolated — cluster {isolatedAlert.id.slice(0, 8)}</span>
          <button
            type="button"
            onClick={() => setIsolatedId(null)}
            className="rounded-pill border border-border-strong px-2 py-0.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            Show all
          </button>
        </div>
      )}

      {/* No-mock policy (A-13): a backend-down state is a visible error, never silent/stale data. */}
      {(loading || error || (!loading && !error && alerts.length === 0)) && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center bg-surface-sub/80">
          <div className="rounded-card border border-border bg-surface px-5 py-4 text-center shadow-float">
            {loading && <p className="text-sm text-text-secondary">Loading live alerts…</p>}
            {!loading && error && (
              <>
                <p className="text-sm font-medium text-critical">Backend unreachable</p>
                <p className="mt-1 text-xs text-text-muted">{error}</p>
              </>
            )}
            {!loading && !error && alerts.length === 0 && (
              <p className="text-sm text-text-secondary">No chokepoint clusters reported yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-card border border-border bg-surface px-4 py-3 shadow-float">
        <div className="mb-2 text-xs font-semibold text-text-primary">Severity</div>
        <div className="flex flex-col gap-1.5">
          {BANDS.map((band) => {
            const threat = THREAT[band];
            return (
              <div key={band} className="flex items-center gap-2 text-xs text-text-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: threat.color }}
                  aria-hidden
                />
                <span>
                  {threat.range} · {threat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
