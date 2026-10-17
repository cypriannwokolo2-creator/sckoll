import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { Client } from "pg";

/** Load backend/.env (gitignored dev secrets) so tests can derive the test DB URL. */
dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

export function testDatabaseUrl(name?: string): string {
  if (process.env.SCKOLL_TEST_DATABASE_URL) return process.env.SCKOLL_TEST_DATABASE_URL;
  const dev = process.env.DATABASE_URL;
  if (!dev) {
    throw new Error("Set DATABASE_URL (backend/.env) or SCKOLL_TEST_DATABASE_URL to run route tests.");
  }
  // Per-suite database so parallel vitest workers never wipe each other's rows.
  const db = name ?? process.env.SCKOLL_TEST_DB ?? "sckoll_test";
  return dev.replace(/\/[^/?]*(\?.*)?$/, `/${db}$1`);
}

/**
 * Create the suite's database when it does not exist yet.
 * A fresh clone and a CI runner start with none of the `sckoll_test*` databases,
 * so suites provision their own instead of assuming a developer made them.
 */
export async function ensureTestDatabase(url: string): Promise<void> {
  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!dbName) throw new Error(`No database name in ${url}`);
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if ((found.rowCount ?? 0) === 0) {
      await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

/** Provision a suite database from scratch: create it if missing, then push the schema. */
export async function pushSchema(url: string): Promise<void> {
  await ensureTestDatabase(url);
  execSync("npx drizzle-kit push", {
    cwd: new URL("../", import.meta.url).pathname,
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
