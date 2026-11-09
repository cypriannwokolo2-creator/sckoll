import type { FastifyInstance } from "fastify";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/client.js";
import { chatMessages, chatReactions } from "../db/schema.js";
import type { Env } from "../env.js";

export async function registerChatRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // GET /v1/matches/:id/chat: Fetch recent chat messages and reaction tallies
  app.get("/v1/matches/:id/chat", async (req, reply) => {
    const { id } = req.params as { id: string };

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.matchId, id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(60);

    const reactions = await db
      .select()
      .from(chatReactions)
      .where(eq(chatReactions.matchId, id));

    const reactionMap: Record<string, number> = {
      goal: 0,
      fire: 0,
      clap: 0,
      goat: 0,
      shock: 0,
      heart: 0,
    };

    for (const r of reactions) {
      reactionMap[r.reactionType] = r.count;
    }

    // Return messages in chronological order for display
    return {
      messages: messages.reverse(),
      reactions: reactionMap,
    };
  });

  // POST /v1/matches/:id/chat: Send a new chat message
  app.post("/v1/matches/:id/chat", async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      username: z.string().min(1).max(32),
      message: z.string().min(1).max(280),
      teamFlair: z.string().max(8).optional(),
      userBadge: z.enum(["FAN", "VIP", "MOD", "PRO"]).default("FAN"),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Validation failed", details: parsed.error.issues });
    }

    const { username, message, teamFlair, userBadge } = parsed.data;

    const inserted = await db
      .insert(chatMessages)
      .values({
        matchId: id,
        username,
        message,
        teamFlair,
        userBadge,
      })
      .returning();

    return reply.code(201).send({ message: inserted[0] });
  });

  // POST /v1/matches/:id/reactions: Add a live reaction (goal, fire, clap, etc.)
  app.post("/v1/matches/:id/reactions", async (req, reply) => {
    const { id } = req.params as { id: string };
    const schema = z.object({
      reaction: z.enum(["goal", "fire", "clap", "goat", "shock", "heart"]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid reaction type" });
    }

    const { reaction } = parsed.data;

    await db
      .insert(chatReactions)
      .values({
        matchId: id,
        reactionType: reaction,
        count: 1,
      })
      .onConflictDoUpdate({
        target: [chatReactions.matchId, chatReactions.reactionType],
        set: {
          count: sql`${chatReactions.count} + 1`,
          updatedAt: new Date(),
        },
      });

    return { ok: true, reaction };
  });
}
