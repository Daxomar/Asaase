// Anonymous device-scoped auth — ORCHESTRATOR_CONTRACT.md §6. Reads X-Device-Id, upserts into
// `users`, attaches req.user. No passwords/sessions/JWTs. Minimal version needed for
// /api/scans/analyze's user_id FK (T10 owns the full streak/xp/tokens surface on top of this).
import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; deviceId: string };
    }
  }
}

export async function deviceAuth(req: Request, res: Response, next: NextFunction) {
  const deviceId = req.header("X-Device-Id");
  if (!deviceId) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "X-Device-Id header is required" },
    });
    return;
  }

  try {
    await db.insert(users).values({ deviceId }).onConflictDoNothing();
    const [user] = await db.select().from(users).where(eq(users.deviceId, deviceId)).limit(1);
    if (!user) {
      res.status(500).json({
        error: { code: "DB_UNAVAILABLE", message: "failed to provision device user" },
      });
      return;
    }
    req.user = { id: user.id, deviceId: user.deviceId };
    next();
  } catch (err) {
    console.error("[deviceAuth] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
  }
}
