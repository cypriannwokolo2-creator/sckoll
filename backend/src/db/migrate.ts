import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { loadEnv } from "../env.js";

/**
 * Boot-time migration step: applied before the server starts accepting traffic
 * (see `npm start` / the container CMD). Uses the SQL journal in `drizzle/`
 * via the runtime migrator, so the production image needs no dev dependencies.
 *
 * Policy: migrations must be backward-compatible with the previous app version
 * (expand → migrate → contract) because old and new code overlap during deploys.
 */
const env = loadEnv();
const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");
const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });

try {
  await migrate(drizzle(pool), { migrationsFolder });
  console.log(`[migrate] up to date (${migrationsFolder})`);
} catch (err) {
  console.error("[migrate] failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
