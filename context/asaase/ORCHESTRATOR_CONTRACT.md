# Asaase Orchestrator Contract

**mid:** default · **Author:** T6 arch-lead · **Status:** build-ready spec for T7–T19

Binding reference for T7–T19. Types/routes named here are the ones workers import/implement —
do not redeclare or re-derive shapes. Deviating requires updating this doc first (orchestrator call).

---

## 1. Shared domain types — `shared/domain`

**Workspace wiring (T7 must do this first, it doesn't exist yet):**
- `shared/domain/` currently has zero files; `shared/` has no `package.json` and is **not** in
  `pnpm-workspace.yaml` (`packages: ["apps/*"]`). T7 adds `shared/package.json`
  (`"name": "@asaase/shared"`), updates `pnpm-workspace.yaml` to `["apps/*", "shared"]`, and adds
  `"@asaase/shared": "workspace:*"` to backend/dashboard/mobile `package.json`. No build step —
  ship `.ts` source, each app's own compiler/bundler (tsc/Next/Metro) consumes it directly.
- Entry point: `shared/domain/index.ts` re-exporting everything below.

```typescript
// shared/domain/index.ts
export type BlockageType =
  | "sachet_water_rubbers"
  | "pet_bottles"
  | "silt_sand"
  | "overgrown_weeds";

export type Severity = 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;          // uuid, server-generated
  deviceId: string;     // client-generated uuid, unique, the auth anchor
  streak: number;
  xp: number;
  tokens: number;
  lastActivityAt: string | null; // ISO, GMT — drives streak calc
  createdAt: string;
}

export interface Scan {
  id: string;
  userId: string;
  imageUrl: string;      // stored path/URL, not base64
  latitude: number;
  longitude: number;
  blockageType: BlockageType;
  confidence: number;    // 0-1
  severity: Severity;
  clusterId: string;
  createdAt: string;
}

export interface ChokepointCluster {
  id: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  scanCount: number;
  summaryText: string | null; // last cached LLM brief, nullable
  createdAt: string;
  updatedAt: string;
}

// Read-shape returned by GET /api/v1/alerts/summary — cluster + derived breakdown.
// Dashboard's RiskCluster/data-layer types are retired in favor of this (T16).
export interface Alert {
  id: string;
  latitude: number;
  longitude: number;
  severity: Severity;
  scanCount: number;
  blockageBreakdown: Record<BlockageType, number>; // percentages, sum ~100
  updatedAt: string;
}
```

Rules: backend derives Drizzle rows into these types at the API boundary (no leaking DB row
shapes); dashboard/mobile only ever see these. Dashboard's local `BlockageType` (`"plastic"|"silt"|
"organic"|"mixed"`) and `RiskCluster`/`ClusterReport` types in `data/clusters.ts`/`data/reports.ts`
are deleted, not kept as aliases (T16).

---

## 2. Drizzle schema — Postgres + PostGIS

**Module layout:**
- `apps/backend/src/db/schema.ts` — table defs (below)
- `apps/backend/src/db/client.ts` — `drizzle(pool)` export, single shared instance
- `apps/backend/drizzle.config.ts` — drizzle-kit config, migrations to `apps/backend/drizzle/`
- `apps/backend/docker-compose.yml` — local Postgres+PostGIS service

**New backend deps:** `drizzle-orm`, `pg`, `drizzle-kit` (dev), `ai`, `@ai-sdk/openai`,
`@ai-sdk/anthropic`, `zod`, `dotenv`, `cors`, `multer` (image upload, see §9).

**Geography column:** Drizzle has no native PostGIS type — use `customType` for a `geography(Point,4326)`
column, keep plain `latitude`/`longitude` `doublePrecision` columns alongside it for cheap reads
(query/display use the plain columns; spatial `ST_DWithin` queries use the geography column via raw
`sql` — see §5). Populate `location` at insert time via `sql\`ST_SetSRID(ST_MakePoint(${lng},${lat}),4326)::geography\``.

```typescript
// apps/backend/src/db/schema.ts (shape, not exhaustive)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull().unique(),
  streak: integer("streak").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  tokens: integer("tokens").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chokepointClusters = pgTable("chokepoint_clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  location: geography("location"), // customType, geography(Point,4326), GiST-indexed
  severity: integer("severity").notNull().default(1), // clamp 1-5 in app code
  scanCount: integer("scan_count").notNull().default(1),
  summaryText: text("summary_text"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  location: geography("location"),
  blockageType: text("blockage_type").notNull(), // constrain via zod at API layer, not pg enum (YAGNI)
  confidence: real("confidence").notNull(),
  severity: integer("severity").notNull(),
  clusterId: uuid("cluster_id").notNull().references(() => chokepointClusters.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Docker Compose (local dev DB):**
```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: asaase
      POSTGRES_USER: asaase
      POSTGRES_PASSWORD: asaase
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata:
```
T7 runs `CREATE EXTENSION IF NOT EXISTS postgis;` in an init migration (drizzle-kit `custom` migration
or a raw SQL file run before the generated ones). `/health` (A-04) queries `SELECT 1` through the
Drizzle client; DB unreachable → `{ status: "degraded", db: "down" }` at a non-200 status, never a
silent 200.

---

## 3. API route contract

All authenticated routes read `X-Device-Id` header (see §6) — no separate token/session.
Error shape (uniform, no-mock policy):
```typescript
type ApiError = { error: { code: "AI_PROVIDER_UNAVAILABLE" | "DB_UNAVAILABLE" | "VALIDATION_ERROR" | "NOT_FOUND" | "INSUFFICIENT_BALANCE"; message: string } };
```
Ollama/DB unreachable → the matching error code at `503`/`500`, never a 200 with fabricated data.

| Route | Method | Request | Response |
|---|---|---|---|
| `/health` | GET | — | `{ status: "ok"\|"degraded", db: "up"\|"down" }` |
| `/api/scans/analyze` | POST | `multipart/form-data`: `image` (file), `latitude`, `longitude` (fields); header `X-Device-Id` | `{ scan: Scan, cluster: { id: string, severity: Severity, created: boolean } }` \| `ApiError` |
| `/api/clusters/:id/summary` | GET | — | chunked text stream (`streamText(...).pipeTextStreamToResponse(res)`); pre-stream failure → `ApiError` JSON before any chunk is sent |
| `/api/v1/alerts/summary` | GET | — | `{ alerts: Alert[] }` |
| `/api/auth/device` | POST | `{ deviceId: string }` | `{ user: User }` (upsert-by-deviceId, first-sight create) |
| `/api/users/me` | GET | header `X-Device-Id` | `{ user: User }` |
| `/api/streak/ping` | POST | header `X-Device-Id` | `{ streak: number, lastActivityAt: string }` (A-05 day-boundary logic) |
| `/api/quiz/submit` | POST | header `X-Device-Id`; `{ quizId: string, correct: boolean }` | `{ xp: number, tokens: number, awarded: boolean }` |
| `/api/marketplace/redeem` | POST | header `X-Device-Id`; `{ rewardId: string, cost: number }` | `{ tokens: number, redeemed: true }` \| `ApiError` (`INSUFFICIENT_BALANCE`, tokens unchanged) |

---

## 4. AI provider switcher

Single module, `apps/backend/src/ai/provider.ts`. Call sites (`analyze`, `summary` routes) import
`getVisionModel()` / `getTextModel()` — never construct a provider inline.

```typescript
// apps/backend/src/ai/provider.ts
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

const isProd = process.env.NODE_ENV === "production";

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});

const cloud =
  process.env.AI_PROVIDER === "anthropic"
    ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getVisionModel = () => (isProd ? cloud(process.env.AI_VISION_MODEL ?? "gpt-4o-mini") : ollama("llava"));
export const getTextModel = () => (isProd ? cloud(process.env.AI_TEXT_MODEL ?? "gpt-4o-mini") : ollama("llama3.2"));
```
Every call site wraps its `generateObject`/`streamText` call in try/catch; connection errors
(ECONNREFUSED, fetch failure, non-2xx from provider) map to `AI_PROVIDER_UNAVAILABLE` — no fallback
text, no stub classification.

---

## 5. 20m clustering algorithm

On each accepted scan (after vision classification, before persisting `scans` row):

```typescript
// pseudo-Drizzle, apps/backend/src/services/clustering.ts
const nearby = await db.execute(sql`
  SELECT id, severity, scan_count FROM chokepoint_clusters
  WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 20)
  ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography)
  LIMIT 1
`);

if (nearby.length > 0) {
  // attach: bump severity by density, cap at 5; increment scanCount
  await db.update(chokepointClusters).set({
    severity: Math.min(5, nearby[0].severity + 1),
    scanCount: nearby[0].scanCount + 1,
    updatedAt: new Date(),
  }).where(eq(chokepointClusters.id, nearby[0].id));
  clusterId = nearby[0].id;
} else {
  // create: seed severity from the scan's own vision-estimated severity
  const [created] = await db.insert(chokepointClusters).values({
    latitude: lat, longitude: lng,
    location: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
    severity: scan.estimatedSeverity, scanCount: 1,
  }).returning();
  clusterId = created.id;
}
```
Severity scaling rule: +1 per attaching scan, capped at 5 (density-driven, matches FEAT-006 "scales
severity metric as report density increases" without a speculative decay/weighting model — YAGNI).

---

## 6. Auth model — anonymous device identity

- Mobile client generates a `crypto.randomUUID()`-equivalent (Expo: `expo-crypto` `randomUUID()`) once,
  persists it in `SecureStore` (`asaase_device_id` key), reuses forever.
- Every backend request that needs identity sends `X-Device-Id: <uuid>` header.
- Backend `deviceAuth` middleware: reads header → `INSERT ... ON CONFLICT (device_id) DO NOTHING`
  then `SELECT` (or a single upsert) into `users` → attaches `req.user` for the handler.
- No passwords, no sessions, no JWTs. Missing/malformed header → `VALIDATION_ERROR` 400 on routes
  that require identity; `/health` and `/api/v1/alerts/summary` (dashboard, no device) skip this middleware.

---

## 7. Mobile screen inventory

Current state: `apps/mobile/src/app/_layout.tsx` is a single `Stack` (no tabs group), `index.tsx`
is a placeholder with Moti/Lottie commented out. Expo Router file-based convention: every file under
`src/app/` is a route; group folders `(name)/` don't affect the URL, used for shared layout only.

| Screen | Route file | Owner task | Notes |
|---|---|---|---|
| Home / streak+XP | `src/app/index.tsx` | T11 | fix commented Moti/Lottie block (A-16); flame `MotiView`, Reanimated XP bar, haptics on token increment |
| Eco-quiz | `src/app/quiz.tsx` | T12 | 3-5 Qs, calls `/api/quiz/submit` |
| Camera scan | `src/app/scan.tsx` | T13 | `expo-camera` preview + bbox overlay, `expo-location`, posts to `/api/scans/analyze` |
| Marketplace | `src/app/marketplace.tsx` | T14 | reward grid, confetti Lottie on redeem |

Recommendation (not mandatory): keep the flat `Stack` — don't introduce an Expo Router `(tabs)/`
group this late; add a small shared bottom-nav component rendered per-screen instead of restructuring
routing. Reassess only if T11 finds the flat Stack awkward.

---

## 8. Dashboard wiring plan (target end-state for T16)

| File | Change |
|---|---|
| `data/clusters.ts`, `data/reports.ts` | **Deleted.** Replaced by a fetch layer, e.g. `lib/api.ts` exporting `fetchAlertsSummary(): Promise<Alert[]>` and `streamClusterSummary(id, onChunk)` hitting `/api/v1/alerts/summary` and `/api/clusters/:id/summary`. |
| `data/threat.ts` | Kept — `THREAT`/`levelFromScore` band logic is presentation-only, just remap to `Severity` 1-5 direct (no 0-100 `threatScore` anymore): Green 1-2, Amber 3, Red 4-5 (drop the current 4-band critical/high/moderate/low split in favor of PRD's 3 bands). |
| `RiskMap.tsx` | Reads `Alert[]` from the fetch layer (client-side `useEffect`/SWR-less `fetch`, no new dep) instead of importing `clusters`; `cluster.radius` (a mock-only field) is dropped — fixed marker radius or derived from `scanCount`. |
| `ReportsPanel.tsx` | Metrics recomputed from `Alert[]` (severity, scanCount, blockageBreakdown) instead of `RiskCluster` fields (`threatScore`, `verifiedReports`, `rawReports`, `floodThresholdMm` are mock-only — retired, no PRD-backed replacement, cut per YAGNI unless a later task needs them). |
| `ClusterPopup.tsx` | `BLOCKAGE_LABEL` map updated to the 4 PRD enum values; static `cluster.aiSummary` string replaced by a live call to `streamClusterSummary` (T17 wires the actual streaming render — T16 only removes the mock string and stubs the call site). |
| `Sidebar.tsx` | `NAV_ITEMS` (`/dashboard/map`, `/dashboard/clusters`, `/dashboard/analytics`, `/dashboard/rainfall`, `/dashboard/leaderboard`) and the `/dashboard/settings`/`/dashboard/account` links are **all dead** — no such routes exist, dashboard is single-page at `/`. Target end-state: remove the `nav`/`NAV_ITEMS` block and the settings/account links entirely; keep only the logo mark linking to `/`. Do not build the missing pages. |

---

## 9. Open risks / decisions for later tasks

- **PostGIS geography vs geometry:** using `geography` (spherical, meters-accurate `ST_DWithin`)
  per PRD's "20-meter coordinate radius" — simpler and correct for small distances at Accra's
  latitude; `geometry` would need a manual `ST_Transform` to a projected SRID. Geography chosen, no
  further work needed unless T7 hits a Drizzle `customType` friction point.
- **Streaming protocol (T9/T17):** spec above uses plain chunked text (`pipeTextStreamToResponse`)
  over `res` directly — simplest thing that satisfies A-11 ("token-by-token", "not single blocking
  JSON"). If the dashboard fetch layer needs structured stream events later, revisit `toDataStreamResponse`
  (AI SDK data-stream protocol) instead — don't pre-build it now (YAGNI).
- **Image upload encoding:** contract specifies `multipart/form-data` (real file, `multer` on
  backend) over base64-in-JSON — avoids ~33% payload bloat and matches `expo-camera`'s native file
  URIs directly via `expo/fetch` FormData. ETB's snippet uses base64; this contract intentionally
  deviates for a leaner mobile→backend hop. Flag to orchestrator if a worker finds FormData
  unsupported on the target RN/Expo runtime — base64 is the fallback.
- **`shared` workspace linking (T7 blocker to watch):** Expo/Metro + pnpm workspaces monorepos are
  known to need `metro.config.js` adjustments (`watchFolders`, `nodeModulesPaths`) to resolve a
  sibling workspace package. T7 should verify `expo export`/`expo start` actually resolves
  `@asaase/shared` before moving on — don't assume it "just works" from `pnpm-workspace.yaml` alone.
- **Cluster severity model is intentionally naive** (§5, flat +1 per attach, capped at 5) — no
  decay-over-time or weighted-by-distance logic. Acceptable for the mission's assertions (A-10); a
  future task could refine if a validator finds the flat bump insufficiently "scales with density."
