// Single shared Drizzle client. Every route/service imports `db` from here — never constructs
// its own Pool. No-mock policy: connection is real; failures surface, they are not caught here.
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";

function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.PGHOST ?? "localhost";
  const port = process.env.PGPORT ?? "5432";
  const user = process.env.PGUSER ?? "asaase";
  const password = process.env.PGPASSWORD ?? "asaase";
  const database = process.env.PGDATABASE ?? "asaase";
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

export const pool = new Pool({ connectionString: resolveConnectionString() });

// pg.Pool emits 'error' for idle-client failures (e.g. DB restarted/stopped underneath us).
// Without a listener this is an unhandled 'error' event and crashes the process — swallow it here
// so /health can report "degraded" instead of the whole server going down (no-mock policy: the
// server stays up and tells the truth about DB state, it doesn't die silently).
pool.on("error", (err) => {
  console.error("[db] pool error (idle client):", err.message);
});

export const db = drizzle(pool);

/** Trivial connectivity probe for /health (A-04). Never throws — resolves to a boolean. */
export async function isDbReachable(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
