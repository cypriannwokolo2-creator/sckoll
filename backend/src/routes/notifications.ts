import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, count, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { matchEvents, notificationPrefs, notifications, opportunities, savedSearches, users } from "../db/schema.js";
import type { Env } from "../env.js";
import { emit, type AppEvent } from "../lib/events.js";
import { parseSender, sendBrevoEmail } from "../lib/brevo.js";
import { hashToken } from "../lib/password.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";

export const NOTIFICATION_TYPES = [
  "user.welcome",
  "auth.verified",
  "application.received",
  "application.status",
  "shortlist.added",
  "search.alert",
  "contract.milestone",
  "message.received",
  "review.received",
  "payment.receipt",
] as const;

const MAX_PER_HOUR = 20;

async function getPrefs(env: Env, userId: string) {
  const db = getDb(env.DATABASE_URL);
  const existing = (await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, userId)).limit(1))[0];
  if (existing) return existing;
  const inserted = (await db.insert(notificationPrefs).values({ userId }).onConflictDoNothing().returning())[0];
  return inserted ?? { userId, emailEnabled: true, inappEnabled: true, mutedEvents: [] as string[], updatedAt: new Date() };
}

/**
 * Fan-out for one event: never notify the actor (callers pass the recipient),
 * respect prefs + verified-email gate for mail, cap per-user hourly volume,
 * write the in-app row, send the email, then emit on the bus for future
 * subscribers (analytics, push).
 */
export async function notify(env: Env, event: AppEvent & { actorId?: string; requireVerifiedEmail?: boolean }): Promise<void> {
  if (event.actorId && event.actorId === event.userId) return;
  const db = getDb(env.DATABASE_URL);
  const prefs = await getPrefs(env, event.userId);
  if (prefs.mutedEvents.includes(event.type)) return;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, event.userId), gt(notifications.createdAt, hourAgo)));
  if ((recent[0]?.n ?? 0) >= MAX_PER_HOUR) return;

  if (prefs.inappEnabled) {
    await db.insert(notifications).values({
      userId: event.userId,
      type: event.type,
      title: event.title,
      body: event.body ?? "",
      link: event.link ?? "/notifications",
    });
  }

  if (event.email && prefs.emailEnabled) {
    const user = (await db.select().from(users).where(eq(users.id, event.userId)).limit(1))[0];
    const verifiedOk = event.requireVerifiedEmail === false || (user?.emailVerified ?? false);
    if (user && verifiedOk && env.BREVO_API_KEY) {
      try {
        await sendBrevoEmail({
          apiKey: env.BREVO_API_KEY,
          sender: "security",
          senderOverride: parseSender(env.BREVO_FROM_SECURITY),
          securityFrom: env.BREVO_FROM_SECURITY,
          helloFrom: env.BREVO_FROM_HELLO,
          to: [{ email: user.email, ...(user.name ? { name: user.name } : {}) }],
          subject: event.email.subject,
          html: event.email.html,
          tags: event.email.tags ?? [`notif:${event.type}`],
        });
      } catch {
        // best-effort
      }
    } else if (!env.BREVO_API_KEY && env.NODE_ENV !== "production") {
      console.log(`[mail:off] to=${user?.email} subject=${event.email.subject}`);
    }
  }

  await emit(event);
}

/** Stateless unsubscribe token: HMAC-bound to secret rotation. */
export function unsubscribeToken(secret: string, userId: string): string {
  return hashToken(secret, `unsub:${userId}`);
}

export async function registerNotificationRoutes(app: FastifyInstance, env: Env): Promise<void> {
  // GET /v1/notifications — unread first, paginated + unread count
  app.get("/v1/notifications", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const q = request.query as Record<string, string | undefined>;
    const limit = Math.min(Math.max(parseInt(q.limit ?? "20", 10) || 20, 1), 50);
    const offset = Math.max(parseInt(q.offset ?? "0", 10) || 0, 0);
    const db = getDb(env.DATABASE_URL);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(sql`${notifications.readAt} NULLS FIRST`, desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
    const unread = await db
      .select({ n: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    return reply.send({ ok: true, notifications: rows, unread: unread[0]?.n ?? 0 });
  });

  // POST /v1/notifications/read {ids?} — mark listed or all as read
  app.post("/v1/notifications/read", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = z.object({ ids: z.array(z.string().uuid()).max(100).optional() }).safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", message: "Invalid input." });
    const db = getDb(env.DATABASE_URL);
    if (parsed.data.ids && parsed.data.ids.length > 0) {
      for (const id of parsed.data.ids) {
        await db
          .update(notifications)
          .set({ readAt: new Date() })
          .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
      }
    } else {
      await db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
    }
    return reply.send({ ok: true });
  });

  // GET /v1/notifications/prefs + PATCH
  app.get("/v1/notifications/prefs", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    return reply.send({ ok: true, prefs: await getPrefs(env, user.id), types: NOTIFICATION_TYPES });
  });

  app.patch("/v1/notifications/prefs", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const parsed = z
      .object({
        emailEnabled: z.boolean().optional(),
        inappEnabled: z.boolean().optional(),
        mutedEvents: z.array(z.string().max(60)).max(20).optional(),
      })
      .safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: "Invalid input." });
    }
    const db = getDb(env.DATABASE_URL);
    await getPrefs(env, user.id);
    const updated = (
      await db
        .update(notificationPrefs)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(notificationPrefs.userId, user.id))
        .returning()
    )[0];
    return reply.send({ ok: true, prefs: updated });
  });

  // GET /v1/notifications/unsubscribe?token=&email= — one click, no login
  app.get("/v1/notifications/unsubscribe", async (request, reply) => {
    const q = request.query as Record<string, string | undefined>;
    const email = (q.email ?? "").trim().toLowerCase();
    const token = q.token ?? "";
    if (!email || !token) return reply.code(400).send({ error: "invalid_request", message: "Invalid unsubscribe link." });
    const db = getDb(env.DATABASE_URL);
    const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    const valid = user && hashToken(env.AUTH_SECRET, `unsub:${user.id}`) === token;
    if (!valid) return reply.code(400).send({ error: "invalid_request", message: "Invalid unsubscribe link." });
    await getPrefs(env, user.id);
    await db.update(notificationPrefs).set({ emailEnabled: false, updatedAt: new Date() }).where(eq(notificationPrefs.userId, user.id));
    return reply.send({ ok: true, message: "Email notifications off. In-app notifications still work — re-enable anytime in settings." });
  });

  // POST /v1/notifications/digest-run — lazy saved-search digest (hourly per search)
  app.post(
    "/v1/notifications/digest-run",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const db = getDb(env.DATABASE_URL);
      const searches = await db
        .select()
        .from(savedSearches)
        .where(and(eq(savedSearches.userId, user.id), eq(savedSearches.emailAlerts, true)));
      let sent = 0;
      for (const search of searches) {
        if (search.lastDigestAt && Date.now() - search.lastDigestAt.getTime() < 60 * 60 * 1000) continue;
        const since = search.lastDigestAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filters = [];
        if (search.query.trim()) {
          filters.push(
            sql`to_tsvector('english', ${opportunities.title} || ' ' || ${opportunities.description}) @@ plainto_tsquery('english', ${search.query.trim()})`,
          );
        }
        const hits = await db
          .select({ id: opportunities.id, title: opportunities.title })
          .from(opportunities)
          .where(and(eq(opportunities.status, "open"), gt(opportunities.createdAt, since), ...(filters as never[])))
          .limit(10);
        await db.update(savedSearches).set({ lastDigestAt: new Date() }).where(eq(savedSearches.id, search.id));
        if (hits.length === 0) continue;
        await notify(env, {
          type: "search.alert",
          userId: user.id,
          title: `${hits.length} new match${hits.length === 1 ? "" : "es"} for “${search.query || "your search"}”`,
          body: hits.map((h) => h.title).slice(0, 3).join(" · "),
          link: `/find-work${search.query ? `?q=${encodeURIComponent(search.query)}` : ""}`,
          requireVerifiedEmail: false,
          email: {
            subject: `New Sckoll matches for “${search.query || "your search"}”`,
            html: `<p>${hits.map((h) => h.title).join("<br />")}</p><p><a href="${env.SITE_URL.replace(/\/$/, "")}/find-work">View matches</a> · <a href="${env.SITE_URL.replace(/\/$/, "")}/notifications/unsubscribe?token=${unsubscribeToken(env.AUTH_SECRET, user.id)}&email=${encodeURIComponent(user.email)}">Unsubscribe</a></p>`,
            tags: ["search-digest"],
          },
        });
        sent++;
      }
      return reply.send({ ok: true, digests: sent });
    },
  );

  // POST /v1/match-events — telemetry for ranking tuning (view/click/apply)
  app.post(
    "/v1/match-events",
    { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const parsed = z
        .object({
          eventType: z.enum(["view", "click", "apply"]),
          targetType: z.enum(["opportunity", "talent"]),
          targetId: z.string().min(1).max(100),
          scoreRules: z.number().int().min(0).max(100).optional(),
          scoreVector: z.number().int().min(0).max(100).optional(),
          finalScore: z.number().int().min(0).max(100).optional(),
        })
        .safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "invalid_request", message: "Invalid input." });
      }
      await getDb(env.DATABASE_URL)
        .insert(matchEvents)
        .values({ userId: user.id, ...parsed.data });
      return reply.send({ ok: true });
    },
  );
}
