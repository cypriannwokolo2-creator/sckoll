import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, contractFlags, contracts, messages, milestones, notificationPrefs, notifications, opportunities, passwordResetTokens, profiles, reviews, savedSearches, sessions, shortlists, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { pushSchema, testDatabaseUrl } from "../test-setup.js";

const DB = "sckoll_test_contracts";

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: testDatabaseUrl(DB),
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  NODE_ENV: "test",
  GOOGLE_CLIENT_ID: "",
  BREVO_API_KEY: "",
};

const OPP = {
  category: "development-it",
  type: "project",
  title: "Contract test project with sufficient title length",
  description:
    "A sufficiently long description for the contract test project so validation passes without complaint from zod rules.",
  skills: ["react"],
  rateType: "fixed",
};

const PITCH = "I am a great fit with years of experience building exactly this kind of thing for clients.";

async function truncate() {
  const db = getDb(TEST_ENV.DATABASE_URL!);
  await db.delete(contractFlags);
  await db.delete(reviews);
  await db.delete(messages);
  await db.delete(milestones);
  await db.delete(contracts);
  await db.delete(auditLog);
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

describe("contract routes", () => {
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

  it("runs contract → milestone → message → review with auto-complete", async () => {
    const client = await signupAs(app, "cc@sckoll.com", "client");
    const talent = await signupAs(app, "ct@sckoll.com", "talent");
    const outsider = await signupAs(app, "co@sckoll.com", "talent");

    const posted = await app.inject({ method: "POST", url: "/v1/opportunities", headers: { cookie: client.cookie }, payload: OPP });
    const oppId = posted.json().opportunity.id as string;
    const applied = await app.inject({ method: "POST", url: `/v1/opportunities/${oppId}/apply`, headers: { cookie: talent.cookie }, payload: { pitch: PITCH } });
    const appId = applied.json().application.id as string;
    await app.inject({ method: "PATCH", url: `/v1/applications/${appId}`, headers: { cookie: client.cookie }, payload: { status: "accepted" } });

    // Contract requires accepted application; outsider cannot touch it.
    const created = await app.inject({ method: "POST", url: "/v1/contracts", headers: { cookie: client.cookie }, payload: { applicationId: appId } });
    expect(created.statusCode).toBe(201);
    const contractId = created.json().contract.id as string;
    expect(created.json().contract.status).toBe("active");

    // Messaging with scam screening.
    const clean = await app.inject({
      method: "POST",
      url: `/v1/contracts/${contractId}/messages`,
      headers: { cookie: talent.cookie },
      payload: { body: "Demo is ready, please review when you can." },
    });
    expect(clean.json().warning).toBeNull();
    const shady = await app.inject({
      method: "POST",
      url: `/v1/contracts/${contractId}/messages`,
      headers: { cookie: talent.cookie },
      payload: { body: "Please pay me via Western Union outside Sckoll, my telegram is @x." },
    });
    expect(shady.json().message.flagged).toBe(true);
    expect(shady.json().warning).toContain("untraceable");
    const thread = await app.inject({ method: "GET", url: `/v1/contracts/${contractId}/messages`, headers: { cookie: client.cookie } });
    expect(thread.json().messages).toHaveLength(2);

    const dupe = await app.inject({ method: "POST", url: "/v1/contracts", headers: { cookie: client.cookie }, payload: { applicationId: appId } });
    expect(dupe.json().deduped).toBe(true);

    const forbidden = await app.inject({ method: "GET", url: `/v1/contracts/${contractId}`, headers: { cookie: outsider.cookie } });
    expect(forbidden.statusCode).toBe(404);

    const mine = await app.inject({ method: "GET", url: "/v1/contracts/me", headers: { cookie: talent.cookie } });
    expect(mine.json().asTalent).toHaveLength(1);

    // Milestones: client defines, talent submits, client approves.
    const m1 = await app.inject({
      method: "POST",
      url: `/v1/contracts/${contractId}/milestones`,
      headers: { cookie: client.cookie },
      payload: { title: "First working demo", amount: 1500 },
    });
    expect(m1.statusCode).toBe(201);
    const m1Id = m1.json().milestone.id as string;
    const m2 = await app.inject({
      method: "POST",
      url: `/v1/contracts/${contractId}/milestones`,
      headers: { cookie: client.cookie },
      payload: { title: "Final delivery and docs" },
    });
    const m2Id = m2.json().milestone.id as string;

    const talentApprove = await app.inject({ method: "PATCH", url: `/v1/milestones/${m1Id}`, headers: { cookie: talent.cookie }, payload: { status: "approved" } });
    expect(talentApprove.statusCode).toBe(403);

    await app.inject({ method: "PATCH", url: `/v1/milestones/${m1Id}`, headers: { cookie: talent.cookie }, payload: { status: "submitted" } });
    await app.inject({ method: "PATCH", url: `/v1/milestones/${m1Id}`, headers: { cookie: client.cookie }, payload: { status: "approved" } });
    let detail = await app.inject({ method: "GET", url: `/v1/contracts/${contractId}`, headers: { cookie: client.cookie } });
    expect(detail.json().contract.status).toBe("active");

    await app.inject({ method: "PATCH", url: `/v1/milestones/${m2Id}`, headers: { cookie: talent.cookie }, payload: { status: "submitted" } });
    await app.inject({ method: "PATCH", url: `/v1/milestones/${m2Id}`, headers: { cookie: client.cookie }, payload: { status: "approved" } });
    detail = await app.inject({ method: "GET", url: `/v1/contracts/${contractId}`, headers: { cookie: client.cookie } });
    expect(detail.json().contract.status).toBe("completed");

    // Reviews both directions, then duplicate rejected.
    const r1 = await app.inject({ method: "POST", url: "/v1/reviews", headers: { cookie: client.cookie }, payload: { contractId, stars: 5, text: "Great work." } });
    expect(r1.statusCode).toBe(201);
    const r2 = await app.inject({ method: "POST", url: "/v1/reviews", headers: { cookie: talent.cookie }, payload: { contractId, stars: 5, text: "Great client." } });
    expect(r2.statusCode).toBe(201);
    const rdup = await app.inject({ method: "POST", url: "/v1/reviews", headers: { cookie: client.cookie }, payload: { contractId, stars: 4, text: "Again." } });
    expect(rdup.statusCode).toBe(409);
  });

  it("gates reviews to completed contracts and flags disputes", async () => {
    const client = await signupAs(app, "dc@sckoll.com", "client");
    const talent = await signupAs(app, "dt@sckoll.com", "talent");
    const posted = await app.inject({ method: "POST", url: "/v1/opportunities", headers: { cookie: client.cookie }, payload: OPP });
    const oppId = posted.json().opportunity.id as string;
    const applied = await app.inject({ method: "POST", url: `/v1/opportunities/${oppId}/apply`, headers: { cookie: talent.cookie }, payload: { pitch: PITCH } });
    const appId = applied.json().application.id as string;
    await app.inject({ method: "PATCH", url: `/v1/applications/${appId}`, headers: { cookie: client.cookie }, payload: { status: "accepted" } });
    const created = await app.inject({ method: "POST", url: "/v1/contracts", headers: { cookie: talent.cookie }, payload: { applicationId: appId } });
    const contractId = created.json().contract.id as string;

    const early = await app.inject({ method: "POST", url: "/v1/reviews", headers: { cookie: client.cookie }, payload: { contractId, stars: 5, text: "Too soon." } });
    expect(early.statusCode).toBe(400);

    const flagged = await app.inject({
      method: "POST",
      url: `/v1/contracts/${contractId}/flag`,
      headers: { cookie: talent.cookie },
      payload: { reason: "Client stopped responding after the first milestone was approved." },
    });
    expect(flagged.statusCode).toBe(201);
    expect(flagged.json().flag.status).toBe("open");
  });
});
