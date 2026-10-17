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
  avatarUrl: z.string().url().max(500).optional(),
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

  // GET /v1/talent/search — rules-based fit scoring (v1, embeddings later)
  app.get("/v1/talent/search", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const query = (request.query as Record<string, string | undefined>) ?? {};
    const q = (query.q ?? "").trim();
    const wanted = (query.skills ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const availability = (query.availability ?? "").trim().toLowerCase();
    const rateMax = parseInt(query.rate_max ?? "", 10);
    const limit = Math.min(Math.max(parseInt(query.limit ?? "20", 10) || 20, 1), 50);
    const offset = Math.max(parseInt(query.offset ?? "0", 10) || 0, 0);
    const db = getDb(env.DATABASE_URL);
    const rows = await db
      .select({ user: users, profile: profiles })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .limit(200);
    const scored = rows
      .filter((r) => r.user.id !== user.id)
      .filter((r) => {
        if (availability && !(r.profile.availability ?? "").toLowerCase().includes(availability)) return false;
        if (Number.isFinite(rateMax)) {
          const rate = parseFloat(String(r.profile.hourlyRate ?? "").replace(/[^0-9.]/g, ""));
          if (Number.isFinite(rate) && rate > (rateMax as number)) return false;
        }
        return true;
      })
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
          availability: r.profile.availability,
          hourlyRate: r.profile.hourlyRate,
          avatarUrl: r.profile.avatarUrl,
          fit: Math.round(Math.min(score, 0.99) * 100),
        };
      })
      .filter((r) => (q || wanted.length > 0 ? r.fit >= 60 : true))
      .sort((a, b) => b.fit - a.fit);
    return reply.send({ ok: true, results: scored.slice(offset, offset + limit), total: scored.length });
  });

  // GET /v1/profiles/:id — public safe view (no email, no internal flags)
  app.get("/v1/profiles/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (
      await db
        .select({ user: users, profile: profiles })
        .from(users)
        .innerJoin(profiles, eq(profiles.userId, users.id))
        .where(eq(users.id, id))
        .limit(1)
    )[0];
    if (!row) return reply.code(404).send({ error: "not_found", message: "Profile not found." });
    return reply.send({
      ok: true,
      profile: {
        id: row.user.id,
        name: row.user.name,
        role: row.user.role,
        headline: row.profile.headline,
        bio: row.profile.bio,
        location: row.profile.location,
        availability: row.profile.availability,
        hourlyRate: row.profile.hourlyRate,
        avatarUrl: row.profile.avatarUrl,
        skills: row.profile.skills,
        links: row.profile.links,
      },
    });
  });
}
