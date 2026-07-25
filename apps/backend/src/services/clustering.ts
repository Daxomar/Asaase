// 20m PostGIS clustering — ORCHESTRATOR_CONTRACT.md §5 (A-10). Real ST_DWithin/ST_Distance
// spatial query against the geography column, not an in-memory haversine approximation.
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { chokepointClusters } from "../db/schema.js";
import type { Severity } from "@asaase/shared";

const CLUSTER_RADIUS_METERS = 20;

interface NearbyClusterRow {
  [key: string]: unknown;
  id: string;
  severity: number;
  scan_count: number;
}

export interface ClusterAttachResult {
  clusterId: string;
  severity: Severity;
  scanCount: number;
  created: boolean;
}

/**
 * Attaches a scan to the nearest cluster within CLUSTER_RADIUS_METERS (bumping severity +1,
 * capped at 5, and scanCount +1), or creates a new cluster seeded from the scan's own location
 * and vision-estimated severity if none is within range.
 */
export async function attachOrCreateCluster(
  lat: number,
  lng: number,
  scanSeverity: Severity,
): Promise<ClusterAttachResult> {
  const nearby = await db.execute<NearbyClusterRow>(sql`
    SELECT id, severity, scan_count
    FROM chokepoint_clusters
    WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${CLUSTER_RADIUS_METERS})
    ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)
    LIMIT 1
  `);

  const [match] = nearby.rows;

  if (match) {
    const nextSeverity = Math.min(5, match.severity + 1) as Severity;
    const nextScanCount = match.scan_count + 1;
    await db
      .update(chokepointClusters)
      .set({ severity: nextSeverity, scanCount: nextScanCount, updatedAt: new Date() })
      .where(eq(chokepointClusters.id, match.id));
    return { clusterId: match.id, severity: nextSeverity, scanCount: nextScanCount, created: false };
  }

  const [created] = await db
    .insert(chokepointClusters)
    .values({
      latitude: lat,
      longitude: lng,
      location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
      severity: scanSeverity,
      scanCount: 1,
    })
    .returning();

  if (!created) {
    throw new Error("cluster insert returned no row");
  }

  return {
    clusterId: created.id,
    severity: created.severity as Severity,
    scanCount: created.scanCount,
    created: true,
  };
}
