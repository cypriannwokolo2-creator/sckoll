import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { auditLog, opportunities, profiles, shortlists, users } from "../db/schema.js";
import type { Env } from "../env.js";
import { notify } from "./notifications.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";

/**
 * Client shortlists with team notes. Talent never sees who shortlisted them
 * in v1 — the hiring room is the client's private workspace.
 */
export async function registerShortlistRoutes(app: FastifyInstance, env: Env): Promise<void> {
  // POST /v1/shortlists {talentId, opportunityId?, notes?}
  app.post(
    "/v1/shortlists",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      if (user.role !== "client" && user.role !== "both") {
        return reply.code(403).send({ error: "forbidden", message: "Switch to a hiring account to shortlist talent." });
      }
      const parsed = z
        .object({
          talentId: z.string().uuid(),
          opportunityId: z.string().uuid().optional(),
          notes: z.string().trim().max(2000).default(""),
        })
        .safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      if (parsed.data.talentId === user.id) {
        return reply.code(400).send({ error: "invalid_request", message: "You cannot shortlist yourself." });
      }
      const db = getDb(env.DATABASE_URL);
      const talent = (await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, parsed.data.talentId)).limit(1))[0];
      if (!talent) return reply.code(404).send({ error: "not_found", message: "Talent not found." });
      if (parsed.data.opportunityId) {
        const opp = (await db.select().from(opportunities).where(eq(opportunities.id, parsed.data.opportunityId)).limit(1))[0];
        if (!opp || opp.clientId !== user.id) {
          return reply.code(404).send({ error: "not_found", message: "Opportunity not found." });
        }
      }
      const inserted = (
        await db
          .insert(shortlists)
          .values({ clientId: user.id, ...parsed.data })
          .onConflictDoNothing()
          .returning()
      )[0];
      if (!inserted) {
        const existing = (
          await db
            .select()
            .from(shortlists)
            .where(and(eq(shortlists.clientId, user.id), eq(shortlists.talentId, parsed.data.talentId)))
            .limit(1)
        )[0];
        return reply.send({ ok: true, shortlist: existing, deduped: true });
      }
      try {
        await db.insert(auditLog).values({ actorId: user.id, action: "shortlist.add", targetType: "shortlist", targetId: inserted.id });
      } catch {
        // best-effort
      }
      await notify(env, {
        actorId: user.id,
        type: "shortlist.added",
        userId: user.id,
        title: `Shortlisted ${talent.name ?? "talent"}`,
        body: "Review proof and add team notes in your hiring room.",
        link: "/team-workspace",
      });
      return reply.code(201).send({ ok: true, shortlist: inserted });
    },
  );

  // GET /v1/shortlists — client's hiring room, talent enriched
  app.get("/v1/shortlists", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const db = getDb(env.DATABASE_URL);
    const rows = await db
      .select({ shortlist: shortlists, talent: users, profile: profiles, opportunity: opportunities })
      .from(shortlists)
      .innerJoin(users, eq(shortlists.talentId, users.id))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(opportunities, eq(shortlists.opportunityId, opportunities.id))
      .where(eq(shortlists.clientId, user.id))
      .orderBy(desc(shortlists.updatedAt));
    return reply.send({
      ok: true,
      shortlists: rows.map((r) => ({
        ...r.shortlist,
        talent: { id: r.talent.id, name: r.talent.name, role: r.talent.role, emailVerified: r.talent.emailVerified },
        profile: r.profile,
        opportunity: r.opportunity ? { id: r.opportunity.id, title: r.opportunity.title, status: r.opportunity.status } : null,
      })),
    });
  });

  // PATCH /v1/shortlists/:id {notes?, opportunityId?}
  app.patch("/v1/shortlists/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = z
      .object({ notes: z.string().trim().max(2000).optional(), opportunityId: z.string().uuid().nullable().optional() })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: "Invalid input." });
    }
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(shortlists).where(eq(shortlists.id, id)).limit(1))[0];
    if (!row || row.clientId !== user.id) {
      return reply.code(404).send({ error: "not_found", message: "Shortlist entry not found." });
    }
    const patch: { notes?: string; opportunityId?: string | null; updatedAt: Date } = { updatedAt: new Date() };
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;
    if (parsed.data.opportunityId !== undefined) patch.opportunityId = parsed.data.opportunityId;
    const updated = (await db.update(shortlists).set(patch).where(eq(shortlists.id, id)).returning())[0];
    return reply.send({ ok: true, shortlist: updated });
  });

  // DELETE /v1/shortlists/:id
  app.delete("/v1/shortlists/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(shortlists).where(eq(shortlists.id, id)).limit(1))[0];
    if (!row || row.clientId !== user.id) {
      return reply.code(404).send({ error: "not_found", message: "Shortlist entry not found." });
    }
    await db.delete(shortlists).where(eq(shortlists.id, id));
    return reply.send({ ok: true });
  });
}
