// Gamification API — anonymous device bootstrap, streak, quiz, marketplace.
// ORCHESTRATOR_CONTRACT.md §3 (route table) / §6 (auth model) — A-05, A-07, A-12 backend halves.
//
// `/api/auth/device` is the one route here that runs *without* `deviceAuth`: it's the bootstrap
// call a fresh install makes before it has any server-confirmed identity, so it takes `deviceId`
// in the body (per contract's request shape) and upserts directly. Every other route below sits
// behind the shared `deviceAuth` middleware (X-Device-Id header, auto-provisions on first sight —
// T8's minimal version; this task builds the read/streak/quiz/redeem surface on top of it).
import { Router } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { User } from "@asaase/shared";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { deviceAuth } from "../middleware/deviceAuth.js";

type UserRow = typeof users.$inferSelect;

function toUser(row: UserRow): User {
  return {
    id: row.id,
    deviceId: row.deviceId,
    streak: row.streak,
    xp: row.xp,
    tokens: row.tokens,
    lastActivityAt: row.lastActivityAt ? row.lastActivityAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GMT calendar-day index (days since epoch, UTC) — A-05's increments/resets are day-boundary
// events, not raw millisecond diffs, so two timestamps on the same GMT date always collapse to
// the same index regardless of time-of-day.
function gmtCalendarDay(d: Date): number {
  return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000);
}

// Hardcoded partner-reward catalog (A-12 backend portion) — real MTN/partner fulfillment is out
// of scope per mission_profile.md, this is just the cost table the redeem route checks against.
// Not wired to a listing route: ORCHESTRATOR_CONTRACT.md §3's route table only names
// `/api/marketplace/redeem` for this task; a catalog-listing endpoint isn't contracted here — the
// mobile marketplace grid task (T14) can request one from the orchestrator if it needs it live
// rather than bundling the same constants client-side.
const REWARD_CATALOG: Record<string, { cost: number; label: string }> = {
  "mtn-data-1gb": { cost: 20, label: "MTN 1GB Data Bundle" },
  "mtn-airtime-5": { cost: 40, label: "MTN GHS 5 Airtime Voucher" },
  "cleanup-gear-kit": { cost: 60, label: "Cleanup Gear Kit (gloves + bags)" },
  "eco-tshirt": { cost: 100, label: "Asaase Eco T-Shirt" },
};

export const gamificationRouter: Router = Router();

// POST /api/auth/device — { deviceId } -> { user }. Upsert-by-deviceId, first-sight create.
const deviceBodySchema = z.object({ deviceId: z.string().min(1) });

gamificationRouter.post("/auth/device", async (req, res) => {
  const parsed = deviceBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    return;
  }
  try {
    await db.insert(users).values({ deviceId: parsed.data.deviceId }).onConflictDoNothing();
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.deviceId, parsed.data.deviceId))
      .limit(1);
    if (!row) {
      res.status(500).json({ error: { code: "DB_UNAVAILABLE", message: "failed to provision device user" } });
      return;
    }
    res.status(200).json({ user: toUser(row) });
  } catch (err) {
    console.error("[auth/device] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
  }
});

// GET /api/users/me — current device's streak/xp/tokens snapshot.
gamificationRouter.get("/users/me", deviceAuth, async (req, res) => {
  try {
    const [row] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    if (!row) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "user not found" } });
      return;
    }
    res.status(200).json({ user: toUser(row) });
  } catch (err) {
    console.error("[users/me] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
  }
});

// POST /api/streak/ping — the qualifying-activity check-in (A-05). Day-boundary logic only:
//   - no prior activity            -> streak = 1 (day one)
//   - last activity == today (GMT) -> no-op, already counted today, don't double-increment
//   - last activity == yesterday   -> streak += 1 (continuity holds)
//   - gap > 1 GMT calendar day     -> a day was skipped: reset to 0, then apply today's +1 (= 1)
// `lastActivityAt` is stamped to `now` on every call so the next ping's gap math has a fresh
// anchor; that's safe on same-day pings too since it doesn't change the GMT calendar day.
gamificationRouter.post("/streak/ping", deviceAuth, async (req, res) => {
  try {
    const [row] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    if (!row) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "user not found" } });
      return;
    }

    const now = new Date();
    let nextStreak: number;

    if (!row.lastActivityAt) {
      nextStreak = 1;
    } else {
      const dayGap = gmtCalendarDay(now) - gmtCalendarDay(row.lastActivityAt);
      if (dayGap === 0) {
        nextStreak = row.streak; // already pinged today, no double-count
      } else if (dayGap === 1) {
        nextStreak = row.streak + 1; // continuity from yesterday
      } else {
        nextStreak = 1; // gap > 1 day (or clock skew) — reset, then today's increment
      }
    }

    const [updated] = await db
      .update(users)
      .set({ streak: nextStreak, lastActivityAt: now })
      .where(eq(users.id, row.id))
      .returning();
    if (!updated) {
      throw new Error("streak update returned no row");
    }

    res.status(200).json({
      streak: updated.streak,
      lastActivityAt: updated.lastActivityAt!.toISOString(),
    });
  } catch (err) {
    console.error("[streak/ping] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
  }
});

// POST /api/quiz/submit — { quizId, correct } -> { xp, tokens, awarded } (A-07 backend half).
// Server decides the reward: `correct` only ever *unlocks* the fixed +5XP/+1 token award, it's
// never trusted as "you owe me N tokens" — there's no client-sent reward amount to distrust here,
// the payload shape is exactly what ORCHESTRATOR_CONTRACT.md §3 specifies. Trust-boundary note
// (flagging for orchestrator/validator, not silently assumed): the contract's mobile screen
// inventory puts quiz *content* (the 3-5 Qs + answer key) on the mobile side (T12), so this route
// has no question bank to re-grade `correct` against — it trusts the mobile client's grading the
// same way the contract's request shape implies. If that's wrong, the fix is a quiz-content table
// + server-side grading, which is a contract change, not a T10 judgment call.
const quizSubmitSchema = z.object({ quizId: z.string().min(1), correct: z.boolean() });

gamificationRouter.post("/quiz/submit", deviceAuth, async (req, res) => {
  const parsed = quizSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    return;
  }

  try {
    if (!parsed.data.correct) {
      const [row] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
      if (!row) {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "user not found" } });
        return;
      }
      res.status(200).json({ xp: row.xp, tokens: row.tokens, awarded: false });
      return;
    }

    const [updated] = await db
      .update(users)
      .set({ xp: sql`${users.xp} + 5`, tokens: sql`${users.tokens} + 1` })
      .where(eq(users.id, req.user!.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "user not found" } });
      return;
    }
    res.status(200).json({ xp: updated.xp, tokens: updated.tokens, awarded: true });
  } catch (err) {
    console.error("[quiz/submit] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
  }
});

// POST /api/marketplace/redeem — { rewardId, cost } -> { tokens, redeemed: true } | ApiError
// (A-12 backend half). Server is authoritative on price: `rewardId` must resolve to a catalog
// entry and the request's `cost` must match that entry's real cost exactly (a client sending a
// lower `cost` than the catalog price is rejected outright, not silently honored) — this keeps
// the contract's `{ rewardId, cost }` request shape while still not trusting a client-supplied
// price. Balance check + deduction is one atomic conditional UPDATE (`WHERE tokens >= cost`), not
// a read-then-write, so there's no race between the balance check and the deduction.
const redeemSchema = z.object({ rewardId: z.string().min(1), cost: z.number().int().positive() });

gamificationRouter.post("/marketplace/redeem", deviceAuth, async (req, res) => {
  const parsed = redeemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    return;
  }
  const { rewardId, cost } = parsed.data;
  const reward = REWARD_CATALOG[rewardId];
  if (!reward || reward.cost !== cost) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `unknown reward or cost mismatch for rewardId "${rewardId}"` },
    });
    return;
  }

  try {
    const updated = await db
      .update(users)
      .set({ tokens: sql`${users.tokens} - ${reward.cost}` })
      .where(and(eq(users.id, req.user!.id), gte(users.tokens, reward.cost)))
      .returning();

    if (updated.length === 0) {
      res
        .status(400)
        .json({ error: { code: "INSUFFICIENT_BALANCE", message: "not enough tokens for this reward" } });
      return;
    }

    res.status(200).json({ tokens: updated[0]!.tokens, redeemed: true });
  } catch (err) {
    console.error("[marketplace/redeem] db error:", (err as Error).message);
    res.status(503).json({ error: { code: "DB_UNAVAILABLE", message: "database unreachable" } });
  }
});
