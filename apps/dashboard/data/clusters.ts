import { levelFromScore, type ThreatLevel } from "./threat";

export type BlockageType = "plastic" | "silt" | "organic" | "mixed";
export type ClusterStatus = "pending" | "verified" | "consolidated";

export type RiskCluster = {
  id: string; // e.g. "CL-402"
  name: string; // location, e.g. "Circle Interchange"
  lat: number;
  lng: number;
  radius: number; // metres — PostGIS spatial buffer of the merged cluster
  threatScore: number; // 0–100, AI blockage threat score → drives `level`
  level: ThreatLevel; // derived from threatScore
  blockageType: BlockageType;
  verifiedReports: number; // citizen reports consolidated into this cluster
  rawReports: number; // pre-dedup count — tells the dedup story
  status: ClusterStatus;
  floodThresholdMm: number; // rainfall (mm) that tips this cluster into danger
  aiSummary: string; // LLM district summary snippet
  updated: string; // ISO date
};

// Mock data — replace with the PostGIS cluster feed / API when it's ready.
const raw: Omit<RiskCluster, "level">[] = [
  {
    id: "CL-402",
    name: "Circle Interchange",
    lat: 5.5717,
    lng: -0.2107,
    radius: 900,
    threatScore: 91,
    blockageType: "plastic",
    verifiedReports: 42,
    rawReports: 500,
    status: "consolidated",
    floodThresholdMm: 20,
    aiSummary:
      "Cluster #402 near Circle Interchange has 42 verified reports. Silt and PET plastic blockages are critical. Heavy flood danger if local precipitation exceeds 20mm.",
    updated: "2026-07-17",
  },
  {
    id: "CL-118",
    name: "Kaneshie Market",
    lat: 5.5622,
    lng: -0.2339,
    radius: 650,
    threatScore: 84,
    blockageType: "organic",
    verifiedReports: 31,
    rawReports: 260,
    status: "consolidated",
    floodThresholdMm: 18,
    aiSummary:
      "Kaneshie Market drain cluster shows heavy organic waste accumulation from market runoff. 31 verified reports confirm standing water after moderate rainfall.",
    updated: "2026-07-17",
  },
  {
    id: "CL-207",
    name: "Agbogbloshie",
    lat: 5.5490,
    lng: -0.2225,
    radius: 800,
    threatScore: 78,
    blockageType: "mixed",
    verifiedReports: 27,
    rawReports: 190,
    status: "verified",
    floodThresholdMm: 22,
    aiSummary:
      "Mixed e-waste and silt blockage near Agbogbloshie market. 27 citizen reports verified; drainage capacity already reduced by an estimated 40%.",
    updated: "2026-07-16",
  },
  {
    id: "CL-355",
    name: "Tema Community 1",
    lat: 5.6698,
    lng: -0.0166,
    radius: 500,
    threatScore: 66,
    blockageType: "silt",
    verifiedReports: 18,
    rawReports: 140,
    status: "verified",
    floodThresholdMm: 25,
    aiSummary:
      "Silt buildup along the Tema Community 1 storm drain has narrowed flow by roughly a third. Risk rises sharply once rainfall exceeds 25mm.",
    updated: "2026-07-16",
  },
  {
    id: "CL-289",
    name: "Osu Oxford Street",
    lat: 5.5560,
    lng: -0.1825,
    radius: 400,
    threatScore: 61,
    blockageType: "plastic",
    verifiedReports: 15,
    rawReports: 120,
    status: "verified",
    floodThresholdMm: 24,
    aiSummary:
      "Plastic bag and sachet-water accumulation reported along Oxford Street drains. 15 verified reports; commercial strip runoff is the dominant contributor.",
    updated: "2026-07-15",
  },
  {
    id: "CL-176",
    name: "Achimota",
    lat: 5.5733,
    lng: -0.2059,
    radius: 700,
    threatScore: 58,
    blockageType: "organic",
    verifiedReports: 12,
    rawReports: 95,
    status: "verified",
    floodThresholdMm: 28,
    aiSummary:
      "Leaf litter and organic debris cluster near Achimota forest edge. Moderate threat; monitor ahead of the next rainfall window.",
    updated: "2026-07-15",
  },
  {
    id: "CL-441",
    name: "Dansoman",
    lat: 5.5784,
    lng: -0.2447,
    radius: 550,
    threatScore: 52,
    blockageType: "mixed",
    verifiedReports: 9,
    rawReports: 70,
    status: "pending",
    floodThresholdMm: 26,
    aiSummary:
      "Early-stage mixed debris accumulation reported in Dansoman roundabout drains. Pending field verification before consolidation.",
    updated: "2026-07-14",
  },
  {
    id: "CL-063",
    name: "Legon Junction",
    lat: 5.6501,
    lng: -0.1862,
    radius: 450,
    threatScore: 47,
    blockageType: "silt",
    verifiedReports: 8,
    rawReports: 55,
    status: "verified",
    floodThresholdMm: 30,
    aiSummary:
      "Silt accumulation near Legon Junction from unpaved shoulder runoff. Low-to-moderate threat under current conditions.",
    updated: "2026-07-14",
  },
  {
    id: "CL-512",
    name: "Madina Market",
    lat: 5.6837,
    lng: -0.1669,
    radius: 600,
    threatScore: 44,
    blockageType: "organic",
    verifiedReports: 11,
    rawReports: 80,
    status: "verified",
    floodThresholdMm: 27,
    aiSummary:
      "Market-adjacent organic waste cluster in Madina. Moderate threat; consolidation confirms a recurring seasonal pattern.",
    updated: "2026-07-13",
  },
  {
    id: "CL-098",
    name: "Adabraka",
    lat: 5.5606,
    lng: -0.2067,
    radius: 350,
    threatScore: 35,
    blockageType: "plastic",
    verifiedReports: 6,
    rawReports: 40,
    status: "verified",
    floodThresholdMm: 32,
    aiSummary:
      "Light plastic debris in Adabraka side-street drains. Currently low threat with adequate flow capacity remaining.",
    updated: "2026-07-12",
  },
  {
    id: "CL-334",
    name: "Nima",
    lat: 5.5766,
    lng: -0.1966,
    radius: 500,
    threatScore: 31,
    blockageType: "mixed",
    verifiedReports: 5,
    rawReports: 38,
    status: "pending",
    floodThresholdMm: 30,
    aiSummary:
      "Scattered mixed-waste reports in Nima awaiting field consolidation. No significant flow reduction detected yet.",
    updated: "2026-07-12",
  },
  {
    id: "CL-271",
    name: "Teshie",
    lat: 5.5844,
    lng: -0.1013,
    radius: 400,
    threatScore: 22,
    blockageType: "silt",
    verifiedReports: 4,
    rawReports: 25,
    status: "verified",
    floodThresholdMm: 35,
    aiSummary:
      "Minor silt presence near Teshie coastal drains. Clear-to-low threat; part of routine monitoring rotation.",
    updated: "2026-07-11",
  },
];

export const clusters: RiskCluster[] = raw.map((c) => ({
  ...c,
  level: levelFromScore(c.threatScore),
}));
