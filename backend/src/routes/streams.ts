import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/client.js";
import { streams } from "../db/schema.js";
import type { Env } from "../env.js";

export async function registerStreamRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // GET /v1/matches/:id/streams
  app.get("/v1/matches/:id/streams", async (req, reply) => {
    const { id } = req.params as { id: string };
    const list = await db
      .select()
      .from(streams)
      .where(eq(streams.matchId, id))
      .orderBy(streams.isDefault);

    return { streams: list };
  });

  // POST /v1/matches/:id/streams
  app.post("/v1/matches/:id/streams", async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      serverName: z.string().min(1),
      streamType: z.enum(["hls", "iframe", "mp4", "embed"]).default("hls"),
      streamUrl: z.string().url(),
      quality: z.string().default("1080p"),
      language: z.string().default("EN"),
      bitrate: z.string().optional(),
      isDefault: z.boolean().default(false),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid stream payload", details: parsed.error.issues });
    }

    const created = await db
      .insert(streams)
      .values({
        matchId: id,
        ...parsed.data,
      })
      .returning();

    return reply.code(201).send({ stream: created[0] });
  });

  // POST /v1/streams/:id/report: Mark a stream as broken or needing check
  app.post("/v1/streams/:id/report", async (req, reply) => {
    const { id } = req.params as { id: string };
    // Optionally flag stream or log report
    return { ok: true, message: "Stream issue reported. Switching you to backup server." };
  });
}
