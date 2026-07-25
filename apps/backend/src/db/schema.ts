// Drizzle schema — Postgres + PostGIS. Shapes per ORCHESTRATOR_CONTRACT.md §2.
// `location` columns are a geography(Point,4326) customType (Drizzle has no native PostGIS
// type) kept alongside plain lat/lng doubles: plain columns for cheap reads/display, geography
// column for ST_DWithin/ST_Distance spatial queries (raw `sql`, see clustering service in T8).
import {
  customType,
  doublePrecision,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { BlockageType, Severity } from "@asaase/shared";

const geography = customType<{ data: string }>({
  dataType() {
    return "geography(Point,4326)";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").notNull().unique(),
  streak: integer("streak").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  tokens: integer("tokens").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chokepointClusters = pgTable("chokepoint_clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  location: geography("location"), // GiST-indexed via migration
  severity: integer("severity").$type<Severity>().notNull().default(1), // clamp 1-5 in app code
  scanCount: integer("scan_count").notNull().default(1),
  summaryText: text("summary_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  imageUrl: text("image_url").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  location: geography("location"),
  // $type<BlockageType>() ties this column to the shared enum (A-01) — no pg enum (YAGNI per
  // original note), still constrained via zod at API layer (T8) for runtime validation.
  blockageType: text("blockage_type").$type<BlockageType>().notNull(),
  confidence: real("confidence").notNull(),
  severity: integer("severity").$type<Severity>().notNull(),
  clusterId: uuid("cluster_id")
    .notNull()
    .references(() => chokepointClusters.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
