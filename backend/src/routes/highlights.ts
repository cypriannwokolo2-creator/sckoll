import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { highlights } from "../db/schema.js";
import type { Env } from "../env.js";

export async function registerHighlightRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // GET /v1/highlights: List all match highlights
  app.get("/v1/highlights", async (_req, reply) => {
    const list = await db
      .select()
      .from(highlights)
      .orderBy(desc(highlights.createdAt))
      .limit(30);

    return { highlights: list };
  });

  // GET /v1/highlights/:id
  app.get("/v1/highlights/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await db.select().from(highlights).where(eq(highlights.id, id)).limit(1);
    if (!row.length) {
      return reply.code(404).send({ error: "Highlight not found" });
    }
    return { highlight: row[0] };
  });
}
