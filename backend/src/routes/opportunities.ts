import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { auditLog, opportunities, type Opportunity } from "../db/schema.js";
import type { Env } from "../env.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";

const CategorySchema = z.enum([
  "development-it",
  "design-creative",
  "writing-content",
  "sales-marketing",
  "finance-operations",
  "engineering",
  "customer-support",
  "consulting",
]);

const OpportunityInput = z.object({
  category: CategorySchema.default("development-it"),
  type: z.enum(["project", "role", "contract"]).default("project"),
  title: z.string().trim().min(10).max(160),
  description: z.string().trim().min(50).max(5000),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  budgetMin: z.number().int().min(0).max(100_000_000).optional(),
  budgetMax: z.number().int().min(0).max(100_000_000).optional(),
  rateType: z.enum(["fixed", "hourly", "salary"]).default("fixed"),
  location: z.string().trim().max(120).optional(),
  remote: z.boolean().default(true),
  status: z.enum(["draft", "open"]).default("open"),
});

export const CATEGORY_SLUGS = CategorySchema.options;

function publicOpportunity(row: Opportunity) {
  const { ...rest } = row;
  return rest;
}

async function logAction(env: Env, actorId: string | undefined, action: string, targetId: string) {
  try {
    await getDb(env.DATABASE_URL).insert(auditLog).values({
      actorId,
      action,
      targetType: "opportunity",
      targetId,
    });
  } catch {
    // audit trail is best-effort; never fail the request for it
  }
}

export async function registerOpportunityRoutes(app: FastifyInstance, env: Env): Promise<void> {
  // POST /v1/opportunities — clients with verified email only
  app.post(
    "/v1/opportunities",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      if (user.role !== "client" && user.role !== "both") {
        return reply.code(403).send({ error: "forbidden", message: "Switch to a hiring account to post work." });
      }
      if (!user.emailVerified) {
        return reply.code(403).send({ error: "unverified", message: "Confirm your email before posting work." });
      }
      const parsed = OpportunityInput.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      if (parsed.data.budgetMin !== undefined && parsed.data.budgetMax !== undefined && parsed.data.budgetMin > parsed.data.budgetMax) {
        return reply.code(400).send({ error: "invalid_request", message: "Minimum budget cannot exceed the maximum." });
      }
      const db = getDb(env.DATABASE_URL);
      const inserted = (
        await db.insert(opportunities).values({ ...parsed.data, clientId: user.id }).returning()
      )[0];
      if (!inserted) return reply.code(500).send({ error: "server_error", message: "Could not create the opportunity." });
      await logAction(env, user.id, "opportunity.create", inserted.id);
      return reply.code(201).send({ ok: true, opportunity: publicOpportunity(inserted) });
    },
  );

  // GET /v1/opportunities — public open listings; owners see own drafts via ?mine=1
  app.get("/v1/opportunities", async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const limit = Math.min(Math.max(parseInt(q.limit ?? "20", 10) || 20, 1), 50);
    const user = await resolveSessionUser(env, request).catch(() => undefined);
    const filters = [];
    if (q.mine === "1") {
      if (!user) return reply.code(401).send({ error: "unauthorized", message: "Sign in to view your postings." });
      filters.push(eq(opportunities.clientId, user.id));
    } else {
      filters.push(eq(opportunities.status, "open"));
    }
    if (q.type === "project" || q.type === "role" || q.type === "contract") {
      filters.push(eq(opportunities.type, q.type));
    }
    if (q.category && (CATEGORY_SLUGS as readonly string[]).includes(q.category)) {
      filters.push(eq(opportunities.category, q.category));
    }
    if (q.skills) {
      const wanted = q.skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 10);
      for (const skill of wanted) {
        filters.push(sql`exists (select 1 from jsonb_array_elements_text(${opportunities.skills}) s where s ilike ${"%" + skill + "%"})`);
      }
    }
    const min = parseInt(q.budget_min ?? "", 10);
    if (Number.isFinite(min)) filters.push(gte(opportunities.budgetMax, min));
    const max = parseInt(q.budget_max ?? "", 10);
    if (Number.isFinite(max)) filters.push(lte(opportunities.budgetMin, max));
    if (q.remote === "true") filters.push(eq(opportunities.remote, true));
    if (q.cursor) {
      const [ts, id] = String(q.cursor).split("|");
      const at = new Date(ts);
      if (!Number.isNaN(at.getTime()) && id) {
        filters.push(sql`(${opportunities.createdAt}, ${opportunities.id}) < (${at.toISOString()}, ${id})`);
      }
    }
    const search = (q.q ?? "").trim();
    const db = getDb(env.DATABASE_URL);
    let rows;
    if (search) {
      rows = await db
        .select()
        .from(opportunities)
        .where(and(...filters, sql`to_tsvector('english', ${opportunities.title} || ' ' || ${opportunities.description}) @@ plainto_tsquery('english', ${search})`))
        .orderBy(sql`ts_rank(to_tsvector('english', ${opportunities.title} || ' ' || ${opportunities.description}), plainto_tsquery('english', ${search})) DESC`, desc(opportunities.createdAt), desc(opportunities.id))
        .limit(limit + 1);
    } else {
      rows = await db
        .select()
        .from(opportunities)
        .where(and(...filters))
        .orderBy(desc(opportunities.createdAt), desc(opportunities.id))
        .limit(limit + 1);
    }
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    return reply.send({
      ok: true,
      opportunities: page.map(publicOpportunity),
      nextCursor: hasMore && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
    });
  });

  // GET /v1/opportunities/:id — open listings public; drafts owner-only
  app.get("/v1/opportunities/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
    if (!row) return reply.code(404).send({ error: "not_found", message: "Opportunity not found." });
    if (row.status !== "open") {
      const user = await resolveSessionUser(env, request).catch(() => undefined);
      if (!user || user.id !== row.clientId) {
        return reply.code(404).send({ error: "not_found", message: "Opportunity not found." });
      }
    }
    return reply.send({ ok: true, opportunity: publicOpportunity(row) });
  });

  // PATCH /v1/opportunities/:id — owner only; closed is terminal
  app.patch(
    "/v1/opportunities/:id",
    { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const row = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
      if (!row || row.clientId !== user.id) {
        return reply.code(404).send({ error: "not_found", message: "Opportunity not found." });
      }
      if (row.status === "closed") {
        return reply.code(409).send({ error: "closed", message: "Closed opportunities cannot be edited." });
      }
      const parsed = OpportunityInput.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      // Note: status enum here is draft|open only — "closed" is rejected by
      // Zod above, and closing happens exclusively through DELETE.
      const updated = (
        await db.update(opportunities).set({ ...parsed.data, updatedAt: new Date() }).where(eq(opportunities.id, id)).returning()
      )[0];
      if (parsed.data.status && parsed.data.status !== row.status) {
        await logAction(env, user.id, `opportunity.${parsed.data.status}`, id);
      }
      return reply.send({ ok: true, opportunity: updated ? publicOpportunity(updated) : null });
    },
  );

  // DELETE /v1/opportunities/:id — soft-close (rows are never hard-deleted)
  app.delete("/v1/opportunities/:id", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(opportunities).where(eq(opportunities.id, id)).limit(1))[0];
    if (!row || row.clientId !== user.id) {
      return reply.code(404).send({ error: "not_found", message: "Opportunity not found." });
    }
    await db.update(opportunities).set({ status: "closed", updatedAt: new Date() }).where(eq(opportunities.id, id));
    await logAction(env, user.id, "opportunity.closed", id);
    return reply.send({ ok: true });
  });

  // GET /v1/categories — live counts of open opportunities per category
  app.get("/v1/categories", async (_request, reply) => {
    const db = getDb(env.DATABASE_URL);
    const counts = await db
      .select({ category: opportunities.category, count: sql<number>`count(*)::int` })
      .from(opportunities)
      .where(eq(opportunities.status, "open"))
      .groupBy(opportunities.category);
    const byCategory = Object.fromEntries(counts.map((c) => [c.category, c.count]));
    return reply.send({ ok: true, counts: byCategory });
  });
}
