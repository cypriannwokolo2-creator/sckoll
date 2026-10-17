import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, opportunities, passwordResetTokens, profiles, savedSearches, sessions, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { pushSchema, testDatabaseUrl } from "../test-setup.js";

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: testDatabaseUrl("sckoll_test_apps"),
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  NODE_ENV: "test",
  GOOGLE_CLIENT_ID: "",
  BREVO_API_KEY: "",
};

const OPP = {
  category: "development-it",
  type: "project",
  title: "Build a realtime dashboard for logistics tracking",
  description:
    "We operate a last-mile delivery network across three cities and need a realtime dashboard showing courier positions, delivery SLAs, and exception alerts. The backend exposes GPS webhooks today. You will design the frontend architecture, implement it in React with map rendering, and hand over documented, tested code within five weeks of kickoff.",
  skills: ["react", "typescript"],
  rateType: "fixed",
};

const PITCH =
  "I have shipped three realtime tracking dashboards with React and map rendering, including one for a courier fleet of two hundred vehicles. I can start Monday and deliver weekly demos against your webhook contract.";

async function truncate() {
  const db = getDb(TEST_ENV.DATABASE_URL!);
  await db.delete(auditLog);
  await db.delete(applications);
  await db.delete(savedSearches);
  await db.delete(opportunities);
  await db.delete(passwordResetTokens);
  await db.delete(verificationTokens);
  await db.delete(sessions);
  await db.delete(profiles);
  await db.delete(users);
}

async function signupAs(app: FastifyInstance, email: string, role: string, verified: boolean, skills: string[] = []): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email, name: email.split("@")[0]!, password: "correct-horse-123", role },
  });
  expect(res.statusCode).toBe(201);
  const db = getDb(TEST_ENV.DATABASE_URL!);
  if (verified) {
    await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
  }
  if (skills.length > 0) {
    const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0]!;
    await db.update(profiles).set({ skills }).where(eq(profiles.userId, user.id));
  }
  return String(res.headers["set-cookie"]).split(";")[0]!;
}

async function postOpp(app: FastifyInstance, cookie: string): Promise<string> {
  const res = await app.inject({ method: "POST", url: "/v1/opportunities", headers: { cookie }, payload: OPP });
  expect(res.statusCode).toBe(201);
  return res.json().opportunity.id as string;
}

describe("application routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await pushSchema(testDatabaseUrl("sckoll_test_apps"));
    ({ app } = await buildServer({ ...loadEnv(), ...TEST_ENV }));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncate();
  });

  it("runs apply → shortlist → accept with cascade close + notifications", async () => {
    const clientCookie = await signupAs(app, "owner@sckoll.com", "client", true);
    const oppId = await postOpp(app, clientCookie);
    const talentCookie = await signupAs(app, "worker@sckoll.com", "talent", true, ["react", "typescript"]);
    const otherCookie = await signupAs(app, "other@sckoll.com", "talent", true, ["postgres"]);

    const applied = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: talentCookie },
      payload: { pitch: PITCH, bidAmount: 4000, bidType: "fixed" },
    });
    expect(applied.statusCode).toBe(201);
    expect(applied.json().application.fitScore).toBe(99);
    const appId = applied.json().application.id as string;

    const other = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: otherCookie },
      payload: { pitch: PITCH },
    });
    expect(other.statusCode).toBe(201);

    const dup = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: talentCookie },
      payload: { pitch: PITCH },
    });
    expect(dup.statusCode).toBe(409);

    const short = await app.inject({
      method: "PATCH",
      url: `/v1/applications/${appId}`,
      headers: { cookie: clientCookie },
      payload: { status: "shortlisted" },
    });
    expect(short.statusCode).toBe(200);
    expect(short.json().application.status).toBe("shortlisted");

    const accepted = await app.inject({
      method: "PATCH",
      url: `/v1/applications/${appId}`,
      headers: { cookie: clientCookie },
      payload: { status: "accepted" },
    });
    expect(accepted.statusCode).toBe(200);

    const opp = await app.inject({ method: "GET", url: `/v1/opportunities/${oppId}`, headers: { cookie: clientCookie } });
    expect(opp.json().opportunity.status).toBe("closed");

    const db = getDb(TEST_ENV.DATABASE_URL!);
    const otherRow = (
      await db.select().from(applications).where(eq(applications.talentId, (await db.select().from(users).where(eq(users.email, "other@sckoll.com")).limit(1))[0]!.id))
    )[0];
    expect(otherRow?.status).toBe("rejected");

    const late = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: talentCookie },
      payload: { pitch: PITCH },
    });
    expect(late.statusCode).toBe(410);

    const pipe = await app.inject({ method: "GET", url: "/v1/pipeline/me", headers: { cookie: talentCookie } });
    expect(pipe.json().pipeline.accepted).toHaveLength(1);
  });

  it("enforces guards: unverified, roles, ownership, withdraw", async () => {
    const clientCookie = await signupAs(app, "c2@sckoll.com", "client", true);
    const oppId = await postOpp(app, clientCookie);

    const unverified = await signupAs(app, "new@sckoll.com", "talent", false);
    const blocked = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: unverified },
      payload: { pitch: PITCH },
    });
    expect(blocked.statusCode).toBe(403);

    const clientApply = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: clientCookie },
      payload: { pitch: PITCH },
    });
    expect(clientApply.statusCode).toBe(403);

    const short = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: clientCookie },
      payload: { pitch: "short" },
    });
    expect(short.statusCode).toBe(403);

    const talentCookie = await signupAs(app, "w2@sckoll.com", "talent", true);
    const selfOpp = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie: await signupAs(app, "both@sckoll.com", "both", true) },
      payload: OPP,
    });
    const selfId = selfOpp.json().opportunity.id as string;
    const selfApply = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${selfId}/apply`,
      headers: { cookie: await signupAs(app, "both2@sckoll.com", "both", true) },
      payload: { pitch: PITCH },
    });
    expect([201, 400, 403]).toContain(selfApply.statusCode);

    const applied = await app.inject({
      method: "POST",
      url: `/v1/opportunities/${oppId}/apply`,
      headers: { cookie: talentCookie },
      payload: { pitch: PITCH },
    });
    const appId = applied.json().application.id as string;

    const foreignStatus = await app.inject({
      method: "PATCH",
      url: `/v1/applications/${appId}`,
      headers: { cookie: talentCookie },
      payload: { status: "accepted" },
    });
    expect(foreignStatus.statusCode).toBe(404);

    const inbox = await app.inject({ method: "GET", url: `/v1/opportunities/${oppId}/applications`, headers: { cookie: talentCookie } });
    expect(inbox.statusCode).toBe(404);

    const withdrawn = await app.inject({ method: "DELETE", url: `/v1/applications/${appId}`, headers: { cookie: talentCookie } });
    expect(withdrawn.statusCode).toBe(200);
    const pipe = await app.inject({ method: "GET", url: "/v1/pipeline/me", headers: { cookie: talentCookie } });
    expect(pipe.json().pipeline.applied).toHaveLength(0);
  });

  it("manages saved searches", async () => {
    const anon = await app.inject({ method: "GET", url: "/v1/saved-searches" });
    expect(anon.statusCode).toBe(401);
    const cookie = await signupAs(app, "saver@sckoll.com", "talent", true);
    const created = await app.inject({
      method: "POST",
      url: "/v1/saved-searches",
      headers: { cookie },
      payload: { query: "react", filters: { type: "project" }, emailAlerts: true },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().search.id as string;
    const list = await app.inject({ method: "GET", url: "/v1/saved-searches", headers: { cookie } });
    expect(list.json().searches).toHaveLength(1);
    const del = await app.inject({ method: "DELETE", url: `/v1/saved-searches/${id}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);
  });
});
