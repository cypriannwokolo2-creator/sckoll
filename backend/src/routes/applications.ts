import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, opportunities, profiles, savedSearches, users } from "../db/schema.js";
import type { Env } from "../env.js";
import { computeFit } from "../lib/match.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";
import { notify } from "./notifications.js";
import { applicationReceivedTemplate, applicationStatusTemplate } from "../email/templates.js";

const ApplySchema = z.object({
  pitch: z.string().trim().min(50).max(3000),
  bidAmount: z.number().int().min(0).max(100_000_000).optional(),
  bidType: z.enum(["fixed", "hourly"]).default("fixed"),
});

const SavedSearchSchema = z.object({
  query: z.string().trim().max(200).default(""),
  filters: z.record(z.string().max(200)).default({}),
  emailAlerts: z.boolean().default(false),
});

async function logAction(env: Env, actorId: string | undefined, action: string, targetType: string, targetId: string) {
  try {
    await getDb(env.DATABASE_URL).insert(auditLog).values({ actorId, action, targetType, targetId });
  } catch {
    // best-effort
  }
}

export async function registerApplicationRoutes(app: FastifyInstance, env: Env): Promise<void> {
  // POST /v1/opportunities/:id/apply — verified talent only, one per opportunity
  app.post(
    "/v1/opportunities/:id/apply",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      if (user.role !== "talent" && user.role !== "both") {
        return reply.code(403).send({ error: "forbidden", message: "Switch to a talent account to apply." });
      }
      if (!user.emailVerified) {
        return reply.code(403).send({ error: "unverified", message: "Confirm your email before applying." });
      }
      const parsed = ApplySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const opp = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
      if (!opp || opp.status !== "open") {
        return reply.code(410).send({ error: "closed", message: "This opportunity is no longer accepting applications." });
      }
      if (opp.clientId === user.id) {
        return reply.code(400).send({ error: "invalid_request", message: "You cannot apply to your own posting." });
      }
      const existing = await db
        .select({ id: applications.id })
        .from(applications)
        .where(and(eq(applications.opportunityId, id), eq(applications.talentId, user.id)))
        .limit(1);
      if (existing.length > 0) {
        return reply.code(409).send({ error: "duplicate", message: "You already applied to this opportunity." });
      }
      const profile = (await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1))[0];
      const fit = computeFit(profile?.skills ?? [], opp.skills ?? []);
      const inserted = (
        await db
          .insert(applications)
          .values({
            opportunityId: id,
            talentId: user.id,
            pitch: parsed.data.pitch,
            bidAmount: parsed.data.bidAmount,
            bidType: parsed.data.bidType,
            fitScore: fit,
          })
          .returning()
      )[0];
      if (!inserted) return reply.code(500).send({ error: "server_error", message: "Could not submit your application." });
      await logAction(env, user.id, "application.create", "application", inserted.id);

      await notify(env, {
        actorId: user.id,
        type: "application.received",
        userId: opp.clientId,
        title: `New application: ${opp.title}`,
        body: `${user.name ?? "A candidate"} applied${parsed.data.bidAmount ? ` · bid $${parsed.data.bidAmount.toLocaleString()}` : ""}.`,
        link: `/find-work/${opp.id}`,
        email: {
          ...applicationReceivedTemplate({
            clientName: undefined,
            talentName: user.name,
            oppTitle: opp.title,
            actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/find-work/${opp.id}`,
          }),
          tags: ["application-received"],
        },
      });
      return reply.code(201).send({ ok: true, application: inserted });
    },
  );

  // DELETE /v1/applications/:id — talent withdraws own application (pre-accept)
  app.delete("/v1/applications/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(applications).where(eq(applications.id, id)).limit(1))[0];
    if (!row || row.talentId !== user.id) {
      return reply.code(404).send({ error: "not_found", message: "Application not found." });
    }
    if (row.status === "accepted") {
      return reply.code(409).send({ error: "accepted", message: "Accepted applications cannot be withdrawn." });
    }
    await db.delete(applications).where(eq(applications.id, id));
    await logAction(env, user.id, "application.withdraw", "application", id);
    return reply.send({ ok: true });
  });

  // GET /v1/pipeline/me — talent's applications grouped by status
  app.get("/v1/pipeline/me", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const db = getDb(env.DATABASE_URL);
    const rows = await db
      .select({ application: applications, opportunity: opportunities })
      .from(applications)
      .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
      .where(eq(applications.talentId, user.id))
      .orderBy(desc(applications.createdAt));
    const grouped: Record<string, typeof rows> = { applied: [], shortlisted: [], accepted: [], rejected: [] };
    for (const row of rows) {
      (grouped[row.application.status] ??= []).push(row);
    }
    return reply.send({ ok: true, pipeline: grouped });
  });

  // GET /v1/opportunities/:id/applications — owner inbox, ranked by fit
  app.get("/v1/opportunities/:id/applications", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const opp = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
    if (!opp || opp.clientId !== user.id) {
      return reply.code(404).send({ error: "not_found", message: "Opportunity not found." });
    }
    const rows = await db
      .select({ application: applications, talent: users, profile: profiles })
      .from(applications)
      .innerJoin(users, eq(applications.talentId, users.id))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(applications.opportunityId, id))
      .orderBy(desc(applications.fitScore), desc(applications.createdAt));
    return reply.send({
      ok: true,
      applications: rows.map((r) => ({
        ...r.application,
        talent: { id: r.talent.id, name: r.talent.name, emailVerified: r.talent.emailVerified },
        profile: r.profile,
      })),
    });
  });

  // PATCH /v1/applications/:id — owner sets status; accept closes the loop
  app.patch(
    "/v1/applications/:id",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = z.object({ status: z.enum(["shortlisted", "accepted", "rejected"]) }).safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: "Status must be shortlisted, accepted, or rejected." });
      }
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const row = (await db.select().from(applications).where(eq(applications.id, id)).limit(1))[0];
      if (!row) return reply.code(404).send({ error: "not_found", message: "Application not found." });
      const opp = (await db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).limit(1))[0];
      if (!opp || opp.clientId !== user.id) {
        return reply.code(404).send({ error: "not_found", message: "Application not found." });
      }
      if (row.status === "accepted") {
        return reply.code(409).send({ error: "accepted", message: "This application was already accepted." });
      }
      const updated = (
        await db.update(applications).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(applications.id, id)).returning()
      )[0];
      await logAction(env, user.id, `application.${parsed.data.status}`, "application", id);

      if (parsed.data.status === "accepted") {
        // Close the opportunity and reject every other application.
        await db.update(opportunities).set({ status: "closed", updatedAt: new Date() }).where(eq(opportunities.id, opp.id));
        const others = await db
          .select()
          .from(applications)
          .where(and(eq(applications.opportunityId, opp.id), eq(applications.status, "applied")));
        const shortlisted = await db
          .select()
          .from(applications)
          .where(and(eq(applications.opportunityId, opp.id), eq(applications.status, "shortlisted")));
        for (const other of [...others, ...shortlisted]) {
          if (other.id === id) continue;
          await db.update(applications).set({ status: "rejected", updatedAt: new Date() }).where(eq(applications.id, other.id));
          await notify(env, {
            actorId: user.id,
            type: "application.status",
            userId: other.talentId,
            title: `Update on your application: ${opp.title}`,
            body: "This one did not move forward. Your profile stays live for the next match.",
            link: "/pipeline",
            email: {
              ...applicationStatusTemplate({
                talentName: undefined,
                oppTitle: opp.title,
                status: "rejected",
                actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/pipeline`,
              }),
              tags: ["application-status"],
            },
          });
        }
      }
      await notify(env, {
        actorId: user.id,
        type: "application.status",
        userId: row.talentId,
        title: `Update on your application: ${opp.title}`,
        body:
          parsed.data.status === "accepted"
            ? "You were accepted. Check your inbox for next steps."
            : parsed.data.status === "shortlisted"
              ? "You were shortlisted — keep an eye on next steps."
              : "Status update on your application.",
        link: "/pipeline",
        email: {
          ...applicationStatusTemplate({
            talentName: undefined,
            oppTitle: opp.title,
            status: parsed.data.status,
            actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/pipeline`,
          }),
          tags: ["application-status"],
        },
      });
      return reply.send({ ok: true, application: updated });
    },
  );

  // GET /v1/saved-searches + POST + DELETE — talent bookmarks + alert toggle
  app.get("/v1/saved-searches", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const db = getDb(env.DATABASE_URL);
    const rows = await db.select().from(savedSearches).where(eq(savedSearches.userId, user.id)).orderBy(desc(savedSearches.createdAt));
    return reply.send({ ok: true, searches: rows });
  });

  app.post(
    "/v1/saved-searches",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = SavedSearchSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      const db = getDb(env.DATABASE_URL);
      const inserted = (
        await db.insert(savedSearches).values({ userId: user.id, ...parsed.data }).returning()
      )[0];
      return reply.code(201).send({ ok: true, search: inserted });
    },
  );

  app.delete("/v1/saved-searches/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(savedSearches).where(eq(savedSearches.id, id)).limit(1))[0];
    if (!row || row.userId !== user.id) {
      return reply.code(404).send({ error: "not_found", message: "Saved search not found." });
    }
    await db.delete(savedSearches).where(eq(savedSearches.id, id));
    return reply.send({ ok: true });
  });
}
