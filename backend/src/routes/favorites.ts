import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/client.js";
import { userFavorites } from "../db/schema.js";
import { resolveSessionUser } from "../lib/session.js";
import type { Env } from "../env.js";

export async function registerFavoriteRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // GET /v1/favorites: List user favorites
  app.get("/v1/favorites", async (req, reply) => {
    const user = await resolveSessionUser(env, req);
    if (!user) {
      return { favorites: [] };
    }

    const rows = await db
      .select()
      .from(userFavorites)
      .where(eq(userFavorites.userId, user.id));

    return { favorites: rows };
  });

  // POST /v1/favorites/toggle: Toggle favorite status
  app.post("/v1/favorites/toggle", async (req, reply) => {
    const user = await resolveSessionUser(env, req);
    if (!user) {
      return reply.code(401).send({ error: "Authentication required to follow teams" });
    }

    const schema = z.object({
      targetType: z.enum(["team", "match", "league"]),
      targetId: z.string().min(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid payload" });
    }

    const { targetType, targetId } = parsed.data;

    const existing = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, user.id),
          eq(userFavorites.targetType, targetType),
          eq(userFavorites.targetId, targetId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(userFavorites)
        .where(
          and(
            eq(userFavorites.userId, user.id),
            eq(userFavorites.targetType, targetType),
            eq(userFavorites.targetId, targetId)
          )
        );
      return { favorited: false };
    } else {
      await db.insert(userFavorites).values({
        userId: user.id,
        targetType,
        targetId,
      });
      return { favorited: true };
    }
  });
}
