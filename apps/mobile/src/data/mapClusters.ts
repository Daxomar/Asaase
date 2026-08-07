import type { BlockageType, Severity } from "@asaase/shared";

export type SubPoint = {
  id: string;
  clusterId: string;
  lat: number;
  lng: number;
  blockageType: BlockageType;
  reportedAt: string;
};

export type MapCluster = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // metres
  severity: Severity;
  scanCount: number;
  dominantBlockage: BlockageType;
};

// TODO: replace with a live GET /api/v1/alerts/summary + per-cluster reports call — this mirrors
// the shape the dashboard used before it was wired to the backend, mocked for UI-first mobile work.
export const mapClusters: MapCluster[] = [
  { id: "CL-402", name: "Circle Interchange", lat: 5.5717, lng: -0.2107, radius: 220, severity: 5, scanCount: 42, dominantBlockage: "pet_bottles" },
  { id: "CL-118", name: "Kaneshie Market", lat: 5.5622, lng: -0.2339, radius: 160, severity: 4, scanCount: 31, dominantBlockage: "sachet_water_rubbers" },
  { id: "CL-207", name: "Agbogbloshie", lat: 5.549, lng: -0.2225, radius: 190, severity: 4, scanCount: 27, dominantBlockage: "silt_sand" },
  { id: "CL-355", name: "Tema Community 1", lat: 5.6698, lng: -0.0166, radius: 130, severity: 3, scanCount: 18, dominantBlockage: "silt_sand" },
  { id: "CL-289", name: "Osu Oxford Street", lat: 5.556, lng: -0.1825, radius: 110, severity: 3, scanCount: 15, dominantBlockage: "pet_bottles" },
  { id: "CL-176", name: "Achimota", lat: 5.5733, lng: -0.2059, radius: 150, severity: 3, scanCount: 12, dominantBlockage: "overgrown_weeds" },
  { id: "CL-441", name: "Dansoman", lat: 5.5784, lng: -0.2447, radius: 120, severity: 2, scanCount: 9, dominantBlockage: "sachet_water_rubbers" },
  { id: "CL-063", name: "Legon Junction", lat: 5.6501, lng: -0.1862, radius: 100, severity: 2, scanCount: 8, dominantBlockage: "silt_sand" },
];

const BLOCKAGE_TYPES: BlockageType[] = ["sachet_water_rubbers", "pet_bottles", "silt_sand", "overgrown_weeds"];
const METERS_PER_DEG_LAT = 111_320;

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic scatter of individual raw reports inside a cluster's radius — same technique
// used for the dashboard's earlier isolate-cluster mock (uniform-in-disk via sqrt(rand)).
function generateSubPoints(): SubPoint[] {
  return mapClusters.flatMap((cluster) => {
    const rand = mulberry32(hashSeed(cluster.id));
    const count = 3 + Math.floor(rand() * 4); // 3-6 sub-points per cluster
    const latRad = (cluster.lat * Math.PI) / 180;

    return Array.from({ length: count }, (_, i) => {
      const angle = rand() * Math.PI * 2;
      const distance = cluster.radius * Math.sqrt(rand());
      const dLat = (distance * Math.cos(angle)) / METERS_PER_DEG_LAT;
      const dLng = (distance * Math.sin(angle)) / (METERS_PER_DEG_LAT * Math.cos(latRad));
      const blockageType =
        rand() < 0.7 ? cluster.dominantBlockage : (BLOCKAGE_TYPES[Math.floor(rand() * BLOCKAGE_TYPES.length)] ?? cluster.dominantBlockage);
      const daysAgo = Math.floor(rand() * 10);
      const reportedAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

      return {
        id: `${cluster.id}-SP-${i + 1}`,
        clusterId: cluster.id,
        lat: cluster.lat + dLat,
        lng: cluster.lng + dLng,
        blockageType,
        reportedAt,
      };
    });
  });
}

export const subPoints: SubPoint[] = generateSubPoints();

export const subPointsForCluster = (clusterId: string): SubPoint[] =>
  subPoints.filter((p) => p.clusterId === clusterId);

export const BLOCKAGE_LABEL: Record<BlockageType, string> = {
  sachet_water_rubbers: "Sachet & rubber",
  pet_bottles: "PET bottles",
  silt_sand: "Silt & sand",
  overgrown_weeds: "Overgrown weeds",
};
