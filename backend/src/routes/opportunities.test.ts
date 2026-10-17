import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { auditLog, opportunities, passwordResetTokens, profiles, sessions, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { testDatabaseUrl } from "../test-setup.js";

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: testDatabaseUrl("sckoll_test_opps"),
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
  budgetMin: 3000,
  budgetMax: 5000,
  rateType: "fixed",
};

async function truncate() {
  const db = getDb(TEST_ENV.DATABASE_URL!);
  await db.delete(auditLog);
  await db.delete(opportunities);
  await db.delete(passwordResetTokens);
  await db.delete(verificationTokens);
  await db.delete(sessions);
  await db.delete(profiles);
  await db.delete(users);
}

async function signupAs(app: FastifyInstance, email: string, role: string, verified: boolean): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/v1/auth/signup",
    payload: { email, name: email.split("@")[0], password: "correct-horse-123", role },
  });
  expect(res.statusCode).toBe(201);
  if (verified) {
    await getDb(TEST_ENV.DATABASE_URL!).update(users).set({ emailVerified: true }).where(eq(users.email, email));
  }
  return String(res.headers["set-cookie"]).split(";")[0]!;
}

describe("opportunity routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    execSync("npx drizzle-kit push", {
      cwd: new URL("../../", import.meta.url).pathname,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl("sckoll_test_opps") },
      stdio: "pipe",
    });
    ({ app } = await buildServer({ ...loadEnv(), ...TEST_ENV }));
  }, 120000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncate();
  });

  it("posts, lists, searches, and closes with ownership enforced", async () => {
    const clientCookie = await signupAs(app, "poster@sckoll.com", "client", true);

    const created = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie: clientCookie },
      payload: OPP,
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().opportunity.id as string;

    const list = await app.inject({ method: "GET", url: "/v1/opportunities" });
    expect(list.statusCode).toBe(200);
    expect(list.json().opportunities).toHaveLength(1);

    const search = await app.inject({ method: "GET", url: "/v1/opportunities?q=logistics+dashboard" });
    expect(search.json().opportunities).toHaveLength(1);
    const miss = await app.inject({ method: "GET", url: "/v1/opportunities?q=unrelated+zebra+plumbing" });
    expect(miss.json().opportunities).toHaveLength(0);

    const detail = await app.inject({ method: "GET", url: `/v1/opportunities/${id}` });
    expect(detail.statusCode).toBe(200);

    const talentCookie = await signupAs(app, "worker@sckoll.com", "talent", true);
    const forbiddenPost = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie: talentCookie },
      payload: OPP,
    });
    expect(forbiddenPost.statusCode).toBe(403);

    const foreignPatch = await app.inject({
      method: "PATCH",
      url: `/v1/opportunities/${id}`,
      headers: { cookie: talentCookie },
      payload: { title: "Hijacked title that is long enough" },
    });
    expect(foreignPatch.statusCode).toBe(404);

    const patched = await app.inject({
      method: "PATCH",
      url: `/v1/opportunities/${id}`,
      headers: { cookie: clientCookie },
      payload: { budgetMax: 6000 },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().opportunity.budgetMax).toBe(6000);

    const closed = await app.inject({ method: "DELETE", url: `/v1/opportunities/${id}`, headers: { cookie: clientCookie } });
    expect(closed.statusCode).toBe(200);
    const gone = await app.inject({ method: "GET", url: "/v1/opportunities" });
    expect(gone.json().opportunities).toHaveLength(0);
    const editClosed = await app.inject({
      method: "PATCH",
      url: `/v1/opportunities/${id}`,
      headers: { cookie: clientCookie },
      payload: { budgetMax: 7000 },
    });
    expect(editClosed.statusCode).toBe(409);

    const db = getDb(TEST_ENV.DATABASE_URL!);
    const logs = await db.select().from(auditLog);
    expect(logs.map((l) => l.action)).toEqual(
      expect.arrayContaining(["opportunity.create", "opportunity.closed"]),
    );
  });

  it("blocks unverified clients and validates budgets", async () => {
    const cookie = await signupAs(app, "fresh@sckoll.com", "client", false);
    const blocked = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie },
      payload: OPP,
    });
    expect(blocked.statusCode).toBe(403);

    const verified = await signupAs(app, "rich@sckoll.com", "client", true);
    const badBudget = await app.inject({
      method: "POST",
      url: "/v1/opportunities",
      headers: { cookie: verified },
      payload: { ...OPP, budgetMin: 9000, budgetMax: 1000 },
    });
    expect(badBudget.statusCode).toBe(400);
    const anon = await app.inject({ method: "POST", url: "/v1/opportunities", payload: OPP });
    expect(anon.statusCode).toBe(401);
  });

  it("paginates with stable cursors and reports live category counts", async () => {
    const cookie = await signupAs(app, "bulk@sckoll.com", "client", true);
    for (let i = 0; i < 3; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/v1/opportunities",
        headers: { cookie },
        payload: { ...OPP, title: `Paginated opportunity number ${i} with sufficient length` },
      });
      expect(res.statusCode).toBe(201);
    }
    const first = await app.inject({ method: "GET", url: "/v1/opportunities?limit=2" });
    expect(first.json().opportunities).toHaveLength(2);
    expect(first.json().nextCursor).toBeTruthy();
    const second = await app.inject({
      method: "GET",
      url: `/v1/opportunities?limit=2&cursor=${encodeURIComponent(first.json().nextCursor)}`,
    });
    expect(second.json().opportunities).toHaveLength(1);
    expect(second.json().nextCursor).toBeNull();

    const cats = await app.inject({ method: "GET", url: "/v1/categories" });
    expect(cats.json().counts["development-it"]).toBe(3);
  });
});
