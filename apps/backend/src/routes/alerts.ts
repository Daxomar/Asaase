// GET /api/v1/alerts/summary + GET /api/clusters/:id/summary — ORCHESTRATOR_CONTRACT.md §3
// (A-11, A-14). Alerts derives Alert[] (shared/domain shape) from chokepointClusters + a
// grouped blockage-type breakdown over their attached scans. Cluster summary streams a real
// LLM-generated municipal action-plan brief.
//
// Streaming note: iterates `streamText(...).fullStream` manually instead of the SDK's
// `pipeTextStreamToResponse` helper. That helper calls `response.writeHead(200, ...)`
// synchronously before reading the first chunk (checked in `ai@7.0.37` dist source) — a
// provider failure on the very first token would then arrive *after* a 200 was already
// committed, making it impossible to return the required ApiError JSON. `fullStream` yields an
// explicit `{ type: "error", error }` part instead of throwing, so we can inspect parts in
// order and only commit headers once the first real `text-delta` part proves the model call
// succeeded. No-mock policy: missing cluster -> 404, unreachable text model -> explicit
// AI_PROVIDER_UNAVAILABLE, never a canned/templated brief.
import { Router } from "express";
import { count, eq } from "drizzle-orm";
import { streamText } from "ai";
import type { Alert, BlockageType, Severity } from "@asaase/shared";
import { getTextModel } from "../ai/provider.js";
import { db } from "../db/client.js";
import { chokepointClusters, scans } from "../db/schema.js";

type ClusterRow = typeof chokepointClusters.$inferSelect;

// Same PRD 4-value enum anchor pattern as routes/scans.ts (A-01 — consume, don't redeclare).
const BLOCKAGE_TYPES = [
  "sachet_water_rubbers",
  "pet_bottles",
  "silt_sand",
  "overgrown_weeds",
] as const satisfies readonly BlockageType[];

export const alertsRouter: Router = Router();

// Postgres `uuid` columns throw a type-cast error (not a "not found") on a malformed literal,
// which would otherwise surface as a misleading 503 DB_UNAVAILABLE. Reject bad ids as 400 before
// they ever reach the query.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/v1/alerts/summary — dashboard's live data source (A-14). No device auth: this is a
// no-device NADMO-side route (ORCHESTRATOR_CONTRACT.md §6 explicitly exempts it).
alertsRouter.get("/v1/alerts/summary", async (_req, res) => {
  try {
    const clusters = await db.select().from(chokepointClusters);

    const breakdownRows = await db
      .select({ clusterId: scans.clusterId, blockageType: scans.blockageType, count: count() })
      .from(scans)
      .groupBy(scans.clusterId, scans.blockageType);

    const countsByCluster = new Map<string, Partial<Record<BlockageType, number>>>();
    for (const row of breakdownRows) {
      const bucket = countsByCluster.get(row.clusterId) ?? {};
      bucket[row.blockageType] = row.count;
      countsByCluster.set(row.clusterId, bucket);
    }

    const alerts: Alert[] = clusters.map((cluster) => {
      const counts = countsByCluster.get(cluster.id) ?? {};
      const total = BLOCKAGE_TYPES.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
      const blockageBreakdown = BLOCKAGE_TYPES.reduce((acc, type) => {
        acc[type] = total > 0 ? Math.round(((counts[type] ?? 0) / total) * 100) : 0;
        return acc;
      }, {} as Record<BlockageType, number>);

      return {
        id: cluster.id,
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        severity: cluster.severity as Severity,
        scanCount: cluster.scanCount,
        blockageBreakdown,
        updatedAt: cluster.updatedAt.toISOString(),
      };
    });

    res.status(200).json({ alerts });
  } catch (err) {
    console.error("[alerts/summary] db error:", (err as Error).message);
    res
      .status(503)
      .json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable while loading alerts" } });
  }
});

// GET /api/clusters/:id/summary — municipal action-plan brief streamed token-by-token (A-11),
// grounded in the cluster's real blockage composition (from attached scans) + severity.
alertsRouter.get("/clusters/:id/summary", async (req, res) => {
  const clusterId = req.params.id;

  if (!UUID_RE.test(clusterId)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `"${clusterId}" is not a valid cluster id (expected a UUID)` },
    });
    return;
  }

  let cluster: ClusterRow | undefined;
  try {
    [cluster] = await db
      .select()
      .from(chokepointClusters)
      .where(eq(chokepointClusters.id, clusterId))
      .limit(1);
  } catch (err) {
    console.error("[clusters/:id/summary] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
    return;
  }

  if (!cluster) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: `no cluster with id ${clusterId}` } });
    return;
  }

  let breakdownRows: { blockageType: BlockageType; count: number }[];
  try {
    breakdownRows = await db
      .select({ blockageType: scans.blockageType, count: count() })
      .from(scans)
      .where(eq(scans.clusterId, clusterId))
      .groupBy(scans.blockageType);
  } catch (err) {
    console.error("[clusters/:id/summary] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
    return;
  }

  const total = breakdownRows.reduce((sum, row) => sum + row.count, 0);
  const compositionLine =
    total > 0
      ? breakdownRows.map((row) => `${row.blockageType} ${Math.round((row.count / total) * 100)}%`).join(", ")
      : "no attached scans yet";

  const prompt = `You are a municipal flood-drainage expert advising NADMO clearance crews in Accra, Ghana.

Chokepoint cluster ${cluster.id} at (${cluster.latitude}, ${cluster.longitude}):
- Severity: ${cluster.severity}/5
- Scan count: ${cluster.scanCount}
- Blockage composition: ${compositionLine}

Write a concise municipal action-plan brief covering: recommended clearance crew size, equipment needed for this specific blockage composition, and priority/urgency given the severity. Plain prose only — no markdown syntax whatsoever (no **bold**, no #headings, no "-" or "*" bullet lists), since this streams straight into a plain-text UI panel. Use short paragraphs or numbered sentences instead of bullets.`;

  const result = streamText({ model: getTextModel(), prompt });

  let headersSent = false;
  try {
    for await (const part of result.fullStream) {
      if (part.type === "error") {
        throw part.error instanceof Error ? part.error : new Error(String(part.error));
      }
      if (part.type === "text-delta") {
        if (!headersSent) {
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          headersSent = true;
        }
        res.write(part.text);
      }
    }
    if (!headersSent) {
      // Model returned zero text-delta parts and no error — still a real (if empty) response,
      // not a mock. Commit an empty 200 body rather than hanging the request.
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    }
    res.end();
  } catch (err) {
    console.error("[clusters/:id/summary] AI provider unreachable:", (err as Error).message);
    if (headersSent) {
      // Mid-stream failure after bytes already sent to the client — can't rewrite the status
      // line at this point. No-mock policy still holds: we don't append fabricated tail text,
      // just end the response; failure is logged server-side.
      res.end();
    } else {
      res.status(503).json({
        error: {
          code: "AI_PROVIDER_UNAVAILABLE",
          message: "text model unreachable or failed to generate brief",
        },
      });
    }
  }
});
