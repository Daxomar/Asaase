import { clusters, type BlockageType } from "./clusters";

// The raw, pre-dedup citizen reports a cluster consolidates. Not returned by
// the main clusters feed — mirrors a future `GET /clusters/:id/reports` call,
// so swapping `reportsByCluster` for a real fetch is a drop-in change.
export type ClusterReport = {
  id: string; // e.g. "RPT-CL-402-01"
  clusterId: string; // FK -> RiskCluster.id
  lat: number;
  lng: number;
  blockageType: BlockageType;
  reportedAt: string; // ISO date
};

const BLOCKAGE_TYPES: BlockageType[] = ["plastic", "silt", "organic", "mixed"];
const METERS_PER_DEG_LAT = 111_320;

// A real bbox query would page/cap results too — keep the mock in the same
// ballpark so the isolation view stays readable instead of a solid smear.
const MAX_SAMPLED_REPORTS = 24;

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

// Deterministic PRNG so the scatter is stable across re-renders instead of
// jumping around every time isolation mode toggles.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateReports(): ClusterReport[] {
  return clusters.flatMap((cluster) => {
    const rand = mulberry32(hashSeed(cluster.id));
    const count = Math.min(cluster.rawReports, MAX_SAMPLED_REPORTS);
    const latRad = (cluster.lat * Math.PI) / 180;

    return Array.from({ length: count }, (_, i) => {
      // Uniform-in-disk scatter: sqrt(rand) avoids bunching at the center.
      const angle = rand() * Math.PI * 2;
      const distance = cluster.radius * Math.sqrt(rand());
      const dLat = (distance * Math.cos(angle)) / METERS_PER_DEG_LAT;
      const dLng =
        (distance * Math.sin(angle)) / (METERS_PER_DEG_LAT * Math.cos(latRad));

      const blockageType: BlockageType =
        rand() < 0.8
          ? cluster.blockageType
          : (BLOCKAGE_TYPES[Math.floor(rand() * BLOCKAGE_TYPES.length)] ??
            cluster.blockageType);

      const daysAgo = Math.floor(rand() * 14);
      const reportedAt = new Date(
        new Date(cluster.updated).getTime() - daysAgo * 86_400_000
      )
        .toISOString()
        .slice(0, 10);

      return {
        id: `RPT-${cluster.id}-${String(i + 1).padStart(2, "0")}`,
        clusterId: cluster.id,
        lat: cluster.lat + dLat,
        lng: cluster.lng + dLng,
        blockageType,
        reportedAt,
      };
    });
  });
}

const REPORTS = generateReports();

export const reportsByCluster = (clusterId: string): ClusterReport[] =>
  REPORTS.filter((r) => r.clusterId === clusterId);
