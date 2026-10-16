import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema> | undefined;

export function getPool(databaseUrl: string): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl, max: 10 });
  }
  return pool;
}

export function getDb(databaseUrl: string): NodePgDatabase<typeof schema> {
  if (!db) {
    db = drizzle(getPool(databaseUrl), { schema });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
}
