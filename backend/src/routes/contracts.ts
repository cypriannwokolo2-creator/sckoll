import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, contractFlags, contracts, messages, milestones, opportunities, payments, reviews, users } from "../db/schema.js";
import type { Env } from "../env.js";
import { notify } from "./notifications.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";
import { contractMilestoneTemplate, contractStartedTemplate, messageDigestTemplate, reviewReceivedTemplate } from "../email/templates.js";

/** Lightweight scam-pattern screen: warn, never block. */
const SCAM_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /western union|moneygram|gift\s?card/i, reason: "requests untraceable payment" },
  { re: /wire transfer.*(outside|off[- ]platform)|send.*crypto.*wallet/i, reason: "requests off-platform payment" },
  { re: /(telegram|whatsapp|signal)\s*[:@]?\s*\S+/i, reason: "moves conversation off-platform" },
  { re: /outside sckoll|off[- ]platform payment/i, reason: "mentions off-platform payment" },
];

function screenMessage(body: string): string | null {
  for (const p of SCAM_PATTERNS) {
    if (p.re.test(body)) return p.reason;
  }
  const links = body.match(/https?:\/\/\S+/g) ?? [];
  if (links.length > 2) return "contains multiple external links";
  return null;
}

async function logAction(env: Env, actorId: string | undefined, action: string, targetId: string) {
  try {
    await getDb(env.DATABASE_URL).insert(auditLog).values({ actorId, action, targetType: "contract", targetId });
  } catch {
    // best-effort
  }
}

export async function registerContractRoutes(app: FastifyInstance, env: Env): Promise<void> {
  // POST /v1/contracts {applicationId, scope?} — parties of an accepted application
  app.post(
    "/v1/contracts",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = z.object({ applicationId: z.string().uuid(), scope: z.string().trim().min(20).max(5000).optional() }).safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: "A valid application is required." });
      }
      const db = getDb(env.DATABASE_URL);
      const application = (await db.select().from(applications).where(eq(applications.id, parsed.data.applicationId)).limit(1))[0];
      if (!application || application.status !== "accepted") {
        return reply.code(400).send({ error: "invalid_request", message: "Contracts start from accepted applications." });
      }
      const opp = (await db.select().from(opportunities).where(eq(opportunities.id, application.opportunityId)).limit(1))[0];
      if (!opp || (opp.clientId !== user.id && application.talentId !== user.id)) {
        return reply.code(404).send({ error: "not_found", message: "Application not found." });
      }
      const existing = (await db.select().from(contracts).where(eq(contracts.opportunityId, opp.id)).limit(1))[0];
      if (existing) return reply.send({ ok: true, contract: existing, deduped: true });
      const inserted = (
        await db
          .insert(contracts)
          .values({
            opportunityId: opp.id,
            applicationId: application.id,
            clientId: opp.clientId,
            talentId: application.talentId,
            scope: parsed.data.scope ?? opp.description,
            status: "active",
          })
          .returning()
      )[0];
      if (!inserted) return reply.code(500).send({ error: "server_error", message: "Could not create the contract." });
      await logAction(env, user.id, "contract.create", inserted.id);
      const otherId = user.id === opp.clientId ? application.talentId : opp.clientId;
      await notify(env, {
        actorId: user.id,
        type: "contract.milestone",
        userId: otherId,
        title: `Contract started: ${opp.title}`,
        body: "Review the scope and agree the first milestone.",
        link: `/contracts/${inserted.id}`,
        email: {
          ...contractStartedTemplate({ oppTitle: opp.title, actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/contracts/${inserted.id}` }),
          tags: ["contract-started"],
        },
      });
      return reply.code(201).send({ ok: true, contract: inserted });
    },
  );

  // GET /v1/contracts/me — both sides
  app.get("/v1/contracts/me", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const db = getDb(env.DATABASE_URL);
    const [asClient, asTalent] = await Promise.all([
      db.select({ contract: contracts, opportunity: opportunities }).from(contracts).innerJoin(opportunities, eq(contracts.opportunityId, opportunities.id)).where(eq(contracts.clientId, user.id)).orderBy(desc(contracts.updatedAt)),
      db.select({ contract: contracts, opportunity: opportunities }).from(contracts).innerJoin(opportunities, eq(contracts.opportunityId, opportunities.id)).where(eq(contracts.talentId, user.id)).orderBy(desc(contracts.updatedAt)),
    ]);
    return reply.send({ ok: true, asClient, asTalent });
  });

  // GET /v1/contracts/:id — parties only, with milestones
  app.get("/v1/contracts/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Contract not found." });
    }
    const opp = (await db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).limit(1))[0];
    const stoneRows = await db.select().from(milestones).where(eq(milestones.contractId, id)).orderBy(milestones.createdAt);
    const client = (await db.select().from(users).where(eq(users.id, row.clientId)).limit(1))[0];
    const talent = (await db.select().from(users).where(eq(users.id, row.talentId)).limit(1))[0];
    return reply.send({
      ok: true,
      contract: row,
      opportunity: opp ? { id: opp.id, title: opp.title, status: opp.status } : null,
      milestones: stoneRows,
      client: client ? { id: client.id, name: client.name } : null,
      talent: talent ? { id: talent.id, name: talent.name } : null,
    });
  });

  // PATCH /v1/contracts/:id — scope edits + cancel
  app.patch("/v1/contracts/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = z.object({ scope: z.string().trim().min(20).max(5000).optional(), status: z.enum(["cancelled"]).optional() }).safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: "Invalid input." });
    }
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Contract not found." });
    }
    if (row.status === "completed" || row.status === "cancelled") {
      return reply.code(409).send({ error: "closed", message: "This contract is closed." });
    }
    const patch: { scope?: string; status?: "cancelled"; updatedAt: Date } = { updatedAt: new Date() };
    if (parsed.data.scope !== undefined) patch.scope = parsed.data.scope;
    if (parsed.data.status !== undefined) patch.status = parsed.data.status;
    const updated = (await db.update(contracts).set(patch).where(eq(contracts.id, id)).returning())[0];
    if (parsed.data.status === "cancelled") await logAction(env, user.id, "contract.cancel", id);
    return reply.send({ ok: true, contract: updated });
  });

  // POST /v1/contracts/:id/milestones — client defines (talent approves by doing)
  app.post(
    "/v1/contracts/:id/milestones",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = z
        .object({ title: z.string().trim().min(5).max(200), amount: z.number().int().min(0).max(100_000_000).optional(), dueDate: z.string().datetime().optional() })
        .safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
      if (!row || row.clientId !== user.id) {
        return reply.code(404).send({ error: "not_found", message: "Contract not found." });
      }
      if (row.status !== "active") {
        return reply.code(409).send({ error: "closed", message: "Milestones belong to active contracts." });
      }
      const inserted = (
        await db
          .insert(milestones)
          .values({
            contractId: id,
            title: parsed.data.title,
            amount: parsed.data.amount,
            dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
          })
          .returning()
      )[0];
      return reply.code(201).send({ ok: true, milestone: inserted });
    },
  );

  // PATCH /v1/milestones/:id — talent submits, client approves/rejects
  app.patch("/v1/milestones/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = z.object({ status: z.enum(["submitted", "approved", "rejected", "pending"]) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", message: "Invalid status." });
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const stone = (await db.select().from(milestones).where(eq(milestones.id, id)).limit(1))[0];
    if (!stone) return reply.code(404).send({ error: "not_found", message: "Milestone not found." });
    const row = (await db.select().from(contracts).where(eq(contracts.id, stone.contractId)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Milestone not found." });
    }
    const isTalent = user.id === row.talentId;
    const allowed = isTalent ? ["submitted", "pending"] : ["approved", "rejected", "pending"];
    if (!allowed.includes(parsed.data.status)) {
      return reply.code(403).send({ error: "forbidden", message: isTalent ? "Talent can submit work, clients approve it." : "Clients approve or reject submitted work." });
    }
    const updated = (await db.update(milestones).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(milestones.id, id)).returning())[0];
    await logAction(env, user.id, `milestone.${parsed.data.status}`, id);

    if (parsed.data.status === "submitted" || parsed.data.status === "approved" || parsed.data.status === "rejected") {
      const otherId = isTalent ? row.clientId : row.talentId;
      const opp = (await db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).limit(1))[0];
      await notify(env, {
        actorId: user.id,
        type: "contract.milestone",
        userId: otherId,
        title: `Milestone ${parsed.data.status}: ${stone.title}`,
        body: opp ? `Contract: ${opp.title}` : undefined,
        link: `/contracts/${row.id}`,
        email: {
          ...contractMilestoneTemplate({
            milestoneTitle: stone.title,
            status: parsed.data.status,
            actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/contracts/${row.id}`,
          }),
          tags: ["contract-milestone"],
        },
      });
    }

    // Auto-complete: every milestone approved → contract completed.
    if (parsed.data.status === "approved") {
      const remaining = await db
        .select({ id: milestones.id })
        .from(milestones)
        .where(and(eq(milestones.contractId, row.id), eq(milestones.status, "pending")));
      const submitted = await db
        .select({ id: milestones.id })
        .from(milestones)
        .where(and(eq(milestones.contractId, row.id), eq(milestones.status, "submitted")));
      const rejected = await db
        .select({ id: milestones.id })
        .from(milestones)
        .where(and(eq(milestones.contractId, row.id), eq(milestones.status, "rejected")));
      if (remaining.length === 0 && submitted.length === 0 && rejected.length === 0) {
        const all = await db.select({ id: milestones.id }).from(milestones).where(eq(milestones.contractId, row.id));
        if (all.length > 0) {
          await db.update(contracts).set({ status: "completed", updatedAt: new Date() }).where(eq(contracts.id, row.id));
          await logAction(env, user.id, "contract.completed", row.id);
        }
      }
    }
    return reply.send({ ok: true, milestone: updated });
  });

  // GET + POST /v1/contracts/:id/messages — parties only, screened
  app.get("/v1/contracts/:id/messages", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Contract not found." });
    }
    const q = request.query as Record<string, string | undefined>;
    const limit = Math.min(Math.max(parseInt(q.limit ?? "50", 10) || 50, 1), 100);
    const rows = await db.select().from(messages).where(eq(messages.contractId, id)).orderBy(messages.createdAt).limit(limit);
    return reply.send({ ok: true, messages: rows });
  });

  app.post(
    "/v1/contracts/:id/messages",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = z.object({ body: z.string().trim().min(1).max(5000) }).safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_request", message: "Message text is required." });
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
      if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
        return reply.code(404).send({ error: "not_found", message: "Contract not found." });
      }
      if (row.status !== "active") {
        return reply.code(409).send({ error: "closed", message: "Messaging is open on active contracts." });
      }
      const reason = screenMessage(parsed.data.body);
      const inserted = (
        await db
          .insert(messages)
          .values({ contractId: id, senderId: user.id, body: parsed.data.body, flagged: reason !== null, flagReason: reason })
          .returning()
      )[0];
      const otherId = user.id === row.clientId ? row.talentId : row.clientId;
      const opp = (await db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).limit(1))[0];
      await notify(env, {
        actorId: user.id,
        type: "message.received",
        userId: otherId,
        title: `New message${opp ? `: ${opp.title}` : ""}`,
        body: parsed.data.body.slice(0, 140),
        link: `/contracts/${row.id}`,
        email: {
          ...messageDigestTemplate({ preview: parsed.data.body.slice(0, 200), actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/contracts/${row.id}` }),
          tags: ["message-received"],
        },
      });
      return reply.code(201).send({ ok: true, message: inserted, warning: reason });
    },
  );

  // POST /v1/contracts/:id/messages/read — mark counterparty messages read
  app.post("/v1/contracts/:id/messages/read", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Contract not found." });
    }
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(and(eq(messages.contractId, id), isNull(messages.readAt)));
    return reply.send({ ok: true });
  });

  // POST /v1/reviews — completed contracts only, one per side
  app.post(
    "/v1/reviews",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = z
        .object({ contractId: z.string().uuid(), stars: z.number().int().min(1).max(5), text: z.string().trim().max(2000).default("") })
        .safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: "Stars (1-5) and a contract are required." });
      }
      const db = getDb(env.DATABASE_URL);
      const row = (await db.select().from(contracts).where(eq(contracts.id, parsed.data.contractId)).limit(1))[0];
      if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
        return reply.code(404).send({ error: "not_found", message: "Contract not found." });
      }
      if (row.status !== "completed") {
        return reply.code(400).send({ error: "invalid_request", message: "Reviews open after the contract completes." });
      }
      const rateeId = user.id === row.clientId ? row.talentId : row.clientId;
      const inserted = (
        await db
          .insert(reviews)
          .values({ contractId: row.id, raterId: user.id, rateeId, stars: parsed.data.stars, text: parsed.data.text })
          .onConflictDoNothing()
          .returning()
      )[0];
      if (!inserted) return reply.code(409).send({ error: "duplicate", message: "You already reviewed this contract." });
      const opp = (await db.select().from(opportunities).where(eq(opportunities.id, row.opportunityId)).limit(1))[0];
      await notify(env, {
        actorId: user.id,
        type: "review.received",
        userId: rateeId,
        title: `New ${parsed.data.stars}-star review${opp ? `: ${opp.title}` : ""}`,
        body: parsed.data.text.slice(0, 140),
        link: `/contracts/${row.id}`,
        email: {
          ...reviewReceivedTemplate({ stars: parsed.data.stars, actionUrl: `${env.SITE_URL.replace(/\/$/, "")}/contracts/${row.id}` }),
          tags: ["review-received"],
        },
      });
      return reply.code(201).send({ ok: true, review: inserted });
    },
  );

  // POST /v1/contracts/:id/flag — dispute queue stub
  app.post("/v1/contracts/:id/flag", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = z.object({ reason: z.string().trim().min(10).max(2000) }).safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", message: "Describe the issue (min 10 characters)." });
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Contract not found." });
    }
    const inserted = (await db.insert(contractFlags).values({ contractId: id, reporterId: user.id, reason: parsed.data.reason }).returning())[0];
    await logAction(env, user.id, "contract.flag", id);
    // Freeze held funds while the dispute is reviewed.
    await db
      .update(payments)
      .set({ status: "frozen", updatedAt: new Date() })
      .where(and(eq(payments.contractId, id), eq(payments.status, "held")));
    return reply.code(201).send({ ok: true, flag: inserted });
  });
}
