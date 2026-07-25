// POST /api/scans/analyze — ORCHESTRATOR_CONTRACT.md §3/§9 (A-09, A-10). multipart/form-data
// (image file + lat/lng fields) per the contract's deliberate deviation from ETB's base64
// snippet (leaner mobile->backend hop, avoids ~33% payload bloat). Vision classification via
// the AI provider switcher, no mock fallback: provider failure -> AI_PROVIDER_UNAVAILABLE,
// never a fabricated classification. Successful scans run the real 20m ST_DWithin clustering
// query before responding.
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { sql } from "drizzle-orm";
import { generateObject } from "ai";
import { z } from "zod";
import type { BlockageType, Severity } from "@asaase/shared";
import { getVisionModel } from "../ai/provider.js";
import { db } from "../db/client.js";
import { scans } from "../db/schema.js";
import { deviceAuth } from "../middleware/deviceAuth.js";
import { attachOrCreateCluster } from "../services/clustering.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Zod runtime enum, anchored to the canonical @asaase/shared BlockageType via `satisfies` so a
// drift between the two fails typecheck instead of silently diverging (A-01 — consume, don't
// redeclare). pg has no native enum here (app-layer zod validation only, per schema.ts comment).
const BLOCKAGE_TYPES = [
  "sachet_water_rubbers",
  "pet_bottles",
  "silt_sand",
  "overgrown_weeds",
] as const satisfies readonly BlockageType[];

const analysisSchema = z.object({
  blockageType: z.enum(BLOCKAGE_TYPES),
  confidence: z.number().min(0).max(1),
  severity: z.number().int().min(1).max(5),
});

const requestFieldsSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const scansRouter: Router = Router();

scansRouter.post("/analyze", deviceAuth, upload.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "image file is required" } });
    return;
  }

  const parsedFields = requestFieldsSchema.safeParse(req.body);
  if (!parsedFields.success) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: parsedFields.error.message },
    });
    return;
  }
  const { latitude, longitude } = parsedFields.data;

  let analysis: z.infer<typeof analysisSchema>;
  try {
    const result = await generateObject({
      model: getVisionModel(),
      schema: analysisSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this drainage/chokepoint photo. Identify the primary blockage material, your confidence (0-1), and a severity estimate (1-5, 5 = fully blocked/urgent).",
            },
            { type: "image", image: file.buffer },
          ],
        },
      ],
    });
    analysis = result.object;
  } catch (err) {
    console.error("[scans/analyze] AI provider unreachable:", (err as Error).message);
    res.status(503).json({
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "vision model unreachable or failed to classify the image",
      },
    });
    return;
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}.jpg`;
    await writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
    const imageUrl = `/uploads/${filename}`;

    const cluster = await attachOrCreateCluster(latitude, longitude, analysis.severity as Severity);

    const [scanRow] = await db
      .insert(scans)
      .values({
        userId: req.user!.id,
        imageUrl,
        latitude,
        longitude,
        location: sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`,
        blockageType: analysis.blockageType,
        confidence: analysis.confidence,
        severity: analysis.severity as Severity,
        clusterId: cluster.clusterId,
      })
      .returning();

    if (!scanRow) {
      throw new Error("scan insert returned no row");
    }

    res.status(201).json({
      scan: {
        id: scanRow.id,
        userId: scanRow.userId,
        imageUrl: scanRow.imageUrl,
        latitude: scanRow.latitude,
        longitude: scanRow.longitude,
        blockageType: scanRow.blockageType,
        confidence: scanRow.confidence,
        severity: scanRow.severity,
        clusterId: scanRow.clusterId,
        createdAt: scanRow.createdAt.toISOString(),
      },
      cluster: {
        id: cluster.clusterId,
        severity: cluster.severity,
        created: cluster.created,
      },
    });
  } catch (err) {
    console.error("[scans/analyze] db error:", (err as Error).message);
    res.status(503).json({
      error: { code: "DB_UNAVAILABLE", message: "database unreachable while persisting scan" },
    });
  }
});
