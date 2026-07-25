"use client";

import { Fragment, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { clusters } from "@/data/clusters";
import { reportsByCluster } from "@/data/reports";
import { THREAT, type ThreatLevel } from "@/data/threat";
import ClusterPopup from "./ClusterPopup";

const LEVELS: ThreatLevel[] = [1, 2, 3, 4];

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

// Smaller marker for an individual raw report, shown only in isolation mode.
function reportIcon(color: string) {
  return L.divIcon({
    className: "report-marker",
    html: `<span style="display:block;width:7px;height:7px;border-radius:9999px;background:${color};border:1.5px solid var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.35);"></span>`,
    iconSize: [7, 7],
    iconAnchor: [3.5, 3.5],
  });
}

export default function RiskMap() {
  const [isolatedId, setIsolatedId] = useState<string | null>(null);

  const isolatedCluster = clusters.find((c) => c.id === isolatedId) ?? null;
  const isolatedReports = useMemo(
    () => (isolatedCluster ? reportsByCluster(isolatedCluster.id) : []),
    [isolatedCluster]
  );
  const visibleClusters = isolatedCluster ? [isolatedCluster] : clusters;

  return (
    <div className="relative h-full w-full">
      <MapContainer center={[5.6, -0.19]} zoom={11} className="h-full w-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visibleClusters.map((cluster) => {
          const threat = THREAT[cluster.level];
          const isSelected = cluster.id === isolatedId;

          return (
            <Fragment key={cluster.id}>
              <Circle
                center={[cluster.lat, cluster.lng]}
                radius={cluster.radius}
                pathOptions={{
                  color: threat.color,
                  fillColor: threat.color,
                  fillOpacity: isSelected ? 0.18 : 0.35,
                  weight: 1.5,
                  className:
                    cluster.level === 1 && !isolatedId ? "cluster-pulse" : undefined,
                }}
              >
                <Tooltip direction="top">{cluster.name}</Tooltip>
              </Circle>

              <Marker
                position={[cluster.lat, cluster.lng]}
                icon={clusterIcon(threat.color, isSelected)}
              >
                <Popup>
                  <ClusterPopup
                    cluster={cluster}
                    isIsolated={isSelected}
                    onToggleIsolate={() =>
                      setIsolatedId((prev) => (prev === cluster.id ? null : cluster.id))
                    }
                  />
                </Popup>
              </Marker>
            </Fragment>
          );
        })}

        {isolatedCluster &&
          isolatedReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={reportIcon(THREAT[isolatedCluster.level].color)}
            >
              <Tooltip direction="top">
                {report.blockageType} · {report.reportedAt}
              </Tooltip>
            </Marker>
          ))}
      </MapContainer>

      {isolatedCluster && (
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-2 text-xs font-medium text-text-primary shadow-float">
          <span>
            Isolated — {isolatedCluster.name} ({isolatedReports.length} reports shown)
          </span>
          <button
            type="button"
            onClick={() => setIsolatedId(null)}
            className="rounded-pill border border-border-strong px-2 py-0.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            Show all
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-card border border-border bg-surface px-4 py-3 shadow-float">
        <div className="mb-2 text-xs font-semibold text-text-primary">Threat level</div>
        <div className="flex flex-col gap-1.5">
          {LEVELS.map((level) => {
            const threat = THREAT[level];
            return (
              <div key={level} className="flex items-center gap-2 text-xs text-text-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: threat.color }}
                  aria-hidden
                />
                <span>
                  L{level} · {threat.label} ({threat.scoreRange})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
