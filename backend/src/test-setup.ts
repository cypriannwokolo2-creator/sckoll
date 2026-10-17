import dotenv from "dotenv";

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
