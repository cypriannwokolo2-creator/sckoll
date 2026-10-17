import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, matchEvents, notificationPrefs, notifications, opportunities, passwordResetTokens, profiles, savedSearches, sessions, shortlists, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { pushSchema, testDatabaseUrl } from "../test-setup.js";
import { unsubscribeToken } from "./notifications.js";

const DB = "sckoll_test_notifs";

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: testDatabaseUrl(DB),
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  NODE_ENV: "test",
  GOOGLE_CLIENT_ID: "",
  BREVO_API_KEY: "",
};

async function truncate() {
  const db = getDb(TEST_ENV.DATABASE_URL!);
  await db.delete(auditLog);
  await db.delete(matchEvents);
  await db.delete(applications);
  await db.delete(shortlists);
  await db.delete(savedSearches);
  await db.delete(notifications);
  await db.delete(notificationPrefs);
  await db.delete(opportunities);
  await db.delete(passwordResetTokens);
  await db.delete(verificationTokens);
  await db.delete(sessions);
  await db.delete(profiles);
  await db.delete(users);
}

async function signupAs(app: FastifyInstance, email: string, role: string): Promise<{ cookie: string; id: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email, name: email.split("@")[0]!, password: "correct-horse-123", role },
  });
  expect(res.statusCode).toBe(201);
  const db = getDb(TEST_ENV.DATABASE_URL!);
  await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
  const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0]!;
  return { cookie: String(res.headers["set-cookie"]).split(";")[0]!, id: user.id };
}

describe("notification routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await pushSchema(testDatabaseUrl(DB));
    ({ app } = await buildServer({ ...loadEnv(), ...TEST_ENV }));
  }, 120000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncate();
  });

  it("writes in-app rows through the apply flow and tracks unread", async () => {
    const client = await signupAs(app, "nc@sckoll.com", "client");
    const talent = await signupAs(app, "nt@sckoll.com", "talent");
    const posted = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie: client.cookie },
      payload: {
        category: "development-it",
        type: "project",
        title: "Notification test project with enough length",
        description:
          "A sufficiently long description for the notification test project so validation passes without complaint from zod rules.",
        skills: ["react"],
        rateType: "fixed",
      },
    });
    const oppId = posted.json().opportunity.id as string;
    const applied = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: talent.cookie },
      payload: { pitch: "I am a great fit with years of experience building exactly this kind of thing for clients." },
    });
    expect(applied.statusCode).toBe(201);

    const inbox = await app.inject({ method: "GET", url: "/v1/notifications", headers: { cookie: client.cookie } });
    expect(inbox.json().unread).toBe(1);
    expect(inbox.json().notifications[0].type).toBe("application.received");

    const read = await app.inject({
      method: "POST",
      url: "/v1/notifications/read",
      headers: { cookie: client.cookie },
      payload: {},
    });
    expect(read.statusCode).toBe(200);
    const after = await app.inject({ method: "GET", url: "/v1/notifications", headers: { cookie: client.cookie } });
    expect(after.json().unread).toBe(0);
  });

  it("respects prefs gating and muting", async () => {
    const client = await signupAs(app, "pc@sckoll.com", "client");
    const talent = await signupAs(app, "pt@sckoll.com", "talent");
    await app.inject({
      method: "PATCH",
      url: "/v1/notifications/prefs",
      headers: { cookie: talent.cookie },
      payload: { emailEnabled: false, mutedEvents: ["application.status"] },
    });
    const prefs = await app.inject({ method: "GET", url: "/v1/notifications/prefs", headers: { cookie: talent.cookie } });
    expect(prefs.json().prefs.emailEnabled).toBe(false);
    expect(prefs.json().prefs.mutedEvents).toContain("application.status");

    const posted = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie: client.cookie },
      payload: {
        category: "development-it",
        type: "project",
        title: "Prefs gating project with sufficient title length",
        description:
          "A sufficiently long description for the prefs gating project so validation passes without complaint from zod rules.",
        skills: [],
        rateType: "fixed",
      },
    });
    const oppId = posted.json().opportunity.id as string;
    const applied = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: talent.cookie },
      payload: { pitch: "I am a great fit with years of experience building exactly this kind of thing for clients." },
    });
    const appId = applied.json().application.id as string;
    await app.inject({
      method: "PATCH",
      url: `/v1/applications/${appId}`,
      headers: { cookie: client.cookie },
      payload: { status: "shortlisted" },
    });
    // Muted event → no in-app row for the talent.
    const inbox = await app.inject({ method: "GET", url: "/v1/notifications", headers: { cookie: talent.cookie } });
    expect(inbox.json().notifications).toHaveLength(0);
  });

  it("unsubscribes with a stateless token and rejects forgeries", async () => {
    const { id } = await signupAs(app, "un@sckoll.com", "talent");
    const token = unsubscribeToken(TEST_ENV.AUTH_SECRET!, id);
    const ok = await app.inject({ method: "GET", url: `/v1/notifications/unsubscribe?token=${token}&email=un@sckoll.com` });
    expect(ok.statusCode).toBe(200);
    const prefs = await app.inject({
      method: "GET",
      url: "/v1/notifications/prefs",
      headers: { cookie: (await app.inject({ method: "POST", url: "/v1/auth/login", payload: { email: "un@sckoll.com", password: "correct-horse-123" } }).then((r) => String(r.headers["set-cookie"]).split(";")[0]!)) },
    });
    expect(prefs.json().prefs.emailEnabled).toBe(false);
    const forged = await app.inject({ method: "GET", url: "/v1/notifications/unsubscribe?token=nope&email=un@sckoll.com" });
    expect(forged.statusCode).toBe(400);
  });

  it("records match telemetry and rejects bad payloads", async () => {
    const anon = await app.inject({ method: "POST", url: "/v1/match-events", payload: { eventType: "view", targetType: "opportunity", targetId: "x" } });
    expect(anon.statusCode).toBe(401);
    const { cookie } = await signupAs(app, "mm@sckoll.com", "talent");
    const bad = await app.inject({ method: "POST", url: "/v1/match-events", headers: { cookie }, payload: { eventType: "nope", targetType: "opportunity", targetId: "x" } });
    expect(bad.statusCode).toBe(400);
    const ok = await app.inject({
      method: "POST",
      url: "/v1/match-events",
      headers: { cookie },
      payload: { eventType: "apply", targetType: "opportunity", targetId: "some-id", scoreRules: 70, scoreVector: 85, finalScore: 79 },
    });
    expect(ok.statusCode).toBe(200);
    const db = getDb(TEST_ENV.DATABASE_URL!);
    const rows = await db.select().from(matchEvents);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.finalScore).toBe(79);
  });
});
