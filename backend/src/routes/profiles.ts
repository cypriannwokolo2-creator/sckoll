import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { profiles, users } from "../db/schema.js";
import type { Env } from "../env.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";

const ProfileUpdateSchema = z.object({
  headline: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(120).optional(),
  availability: z.string().max(120).optional(),
  hourlyRate: z.string().max(60).optional(),
  skills: z.array(z.string().max(60)).max(30).optional(),
  links: z.record(z.string().max(500)).optional(),
  role: z.enum(["talent", "client", "both"]).optional(),
});

export async function registerProfileRoutes(app: FastifyInstance, env: Env): Promise<void> {
  // PATCH /v1/profiles/me — complete onboarding / edit profile
  app.patch("/v1/profiles/me", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = ProfileUpdateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
    }
    const db = getDb(env.DATABASE_URL);
    const { role, ...profileFields } = parsed.data;
    if (role) {
      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, user.id));
    }
    const existing = (await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1))[0];
    let profile;
    if (existing) {
      profile = (
        await db.update(profiles).set({ ...profileFields, updatedAt: new Date() }).where(eq(profiles.userId, user.id)).returning()
      )[0];
    } else {
      profile = (await db.insert(profiles).values({ userId: user.id, ...profileFields }).returning())[0];
    }
    return reply.send({ ok: true, profile });
  });

  // GET /v1/talent/search?q=&skills= — rules-based fit scoring (v1, embeddings later)
  app.get("/v1/talent/search", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const query = (request.query as Record<string, string | undefined>) ?? {};
    const q = (query.q ?? "").trim();
    const wanted = (query.skills ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const db = getDb(env.DATABASE_URL);
    const rows = await db
      .select({ user: users, profile: profiles })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .limit(50);
    const scored = rows
      .filter((r) => r.user.id !== user.id)
      .map((r) => {
        const skills = (r.profile.skills ?? []).map((s) => s.toLowerCase());
        const hay = `${r.user.name ?? ""} ${r.profile.headline ?? ""} ${r.profile.bio ?? ""}`.toLowerCase();
        let score = 0.5;
        if (q && hay.includes(q.toLowerCase())) score += 0.15;
        if (wanted.length > 0) {
          const hits = wanted.filter((w) => skills.some((s) => s.includes(w))).length;
          score += (hits / wanted.length) * 0.35;
        } else if (skills.length > 0) {
          score += 0.1;
        }
        return {
          id: r.user.id,
          name: r.user.name,
          role: r.user.role,
          headline: r.profile.headline,
          bio: r.profile.bio,
          skills: r.profile.skills,
          fit: Math.round(Math.min(score, 0.99) * 100),
        };
      })
      .filter((r) => (q || wanted.length > 0 ? r.fit >= 60 : true))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 20);
    return reply.send({ ok: true, results: scored });
  });
}
