import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { createHmac } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, contractFlags, contracts, messages, milestones, notificationPrefs, notifications, opportunities, passwordResetTokens, payments, profiles, reviews, savedSearches, sessions, shortlists, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { testDatabaseUrl } from "../test-setup.js";
import { __setPaystackTestFetch } from "../lib/paystack.js";

const DB = "sckoll_test_payments";
const TEST_PAYSTACK_SECRET = "sk_test_payments_0123456789abcdef";

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: testDatabaseUrl(DB),
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  NODE_ENV: "test",
  GOOGLE_CLIENT_ID: "",
  BREVO_API_KEY: "",
  PAYSTACK_SECRET_KEY: TEST_PAYSTACK_SECRET,
};

const OPP = {
  category: "development-it",
  type: "project",
  title: "Payment test project with sufficient title length",
  description:
    "A sufficiently long description for the payment test project so validation passes without complaint from zod rules.",
  skills: [],
  rateType: "fixed",
};

const PITCH = "I am a great fit with years of experience building exactly this kind of thing for clients.";

function stubProvider() {
  __setPaystackTestFetch((async (url: string, init?: { body?: string }) => {
    const path = String(url).replace("https://api.paystack.co", "");
    const body = init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : {};
    const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ status: true, data }) });
    if (path === "/transaction/initialize") {
      return ok({ authorization_url: "https://checkout.paystack.com/test", access_code: "a", reference: body.reference });
    }
    if (path.startsWith("/transaction/verify/")) {
      return ok({ status: "success", amount: 500000, currency: "NGN", reference: decodeURIComponent(path.split("/").pop()!) });
    }
    if (path === "/transferrecipient") return ok({ recipient_code: "RCP_TEST" });
    if (path === "/transfer") return ok({ transfer_code: "TRF_TEST", reference: body.reference, status: "success" });
    return { ok: false, status: 400, json: async () => ({ status: false, message: "not stubbed" }) };
  }) as never);
}

async function truncate() {
  const db = getDb(TEST_ENV.DATABASE_URL!);
  await db.delete(contractFlags);
  await db.delete(reviews);
  await db.delete(messages);
  await db.delete(milestones);
  await db.delete(payments);
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

async function setupContract(app: FastifyInstance): Promise<{ client: { cookie: string }; talent: { cookie: string; id: string }; contractId: string; milestoneId: string }> {
  const client = await signupAs(app, "payc@sckoll.com", "client");
  const talent = await signupAs(app, "payt@sckoll.com", "talent");
  const posted = await app.inject({ method: "POST", url: "/v1/opportunities", headers: { cookie: client.cookie }, payload: OPP });
  const oppId = posted.json().opportunity.id as string;
  const applied = await app.inject({ method: "POST", url: `/v1/opportunities/${oppId}/apply`, headers: { cookie: talent.cookie }, payload: { pitch: PITCH } });
  await app.inject({ method: "PATCH", url: `/v1/applications/${applied.json().application.id}`, headers: { cookie: client.cookie }, payload: { status: "accepted" } });
  const created = await app.inject({ method: "POST", url: "/v1/contracts", headers: { cookie: talent.cookie }, payload: { applicationId: applied.json().application.id } });
  const contractId = created.json().contract.id as string;
  const m = await app.inject({ method: "POST", url: `/v1/contracts/${contractId}/milestones`, headers: { cookie: client.cookie }, payload: { title: "Paid milestone", amount: 500000 } });
  return { client, talent, contractId, milestoneId: m.json().milestone.id as string };
}

function sign(raw: string): string {
  return createHmac("sha512", TEST_PAYSTACK_SECRET).update(raw, "utf8").digest("hex");
}

describe("payment routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    execSync("npx drizzle-kit push", {
      cwd: new URL("../../", import.meta.url).pathname,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl(DB) },
      stdio: "pipe",
    });
    stubProvider();
    ({ app } = await buildServer({ ...loadEnv(), ...TEST_ENV }));
  }, 120000);

  afterAll(async () => {
    __setPaystackTestFetch(undefined);
    await app.close();
  });

  beforeEach(async () => {
    await truncate();
  });

  it("funds, holds via webhook, and releases to talent", async () => {
    const { client, talent, contractId, milestoneId } = await setupContract(app);
    const db = getDb(TEST_ENV.DATABASE_URL!);
    await db.update(profiles).set({ payoutAccount: { bankCode: "058", accountNumber: "0123456789", accountName: "Talent" } }).where(eq(profiles.userId, talent.id));

    const funded = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/fund`, headers: { cookie: client.cookie } });
    expect(funded.statusCode).toBe(201);
    expect(funded.json().authorizationUrl).toContain("paystack.com");
    const ref = funded.json().payment.providerRef as string;

    // Replay the webhook twice: second is a no-op (idempotent).
    const payload = JSON.stringify({ event: "charge.success", data: { reference: ref, amount: 500000, status: "success" } });
    const hook1 = await app.inject({ method: "POST", url: "/v1/webhooks/paystack", headers: { "x-paystack-signature": sign(payload), "content-type": "application/json" }, payload });
    expect(hook1.statusCode).toBe(200);
    const hook2 = await app.inject({ method: "POST", url: "/v1/webhooks/paystack", headers: { "x-paystack-signature": sign(payload), "content-type": "application/json" }, payload });
    expect(hook2.statusCode).toBe(200);
    const held = (await db.select().from(payments).where(eq(payments.providerRef, ref)).limit(1))[0]!;
    expect(held.status).toBe("held");

    // Unapproved milestone cannot release.
    const early = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/release`, headers: { cookie: client.cookie } });
    expect(early.statusCode).toBe(400);

    await app.inject({ method: "PATCH", url: `/v1/milestones/${milestoneId}`, headers: { cookie: talent.cookie }, payload: { status: "submitted" } });
    await app.inject({ method: "PATCH", url: `/v1/milestones/${milestoneId}`, headers: { cookie: client.cookie }, payload: { status: "approved" } });
    const released = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/release`, headers: { cookie: client.cookie } });
    expect(released.statusCode).toBe(201);
    expect(released.json().payment.direction).toBe("out");

    // Second release is deduped.
    const again = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/release`, headers: { cookie: client.cookie } });
    expect(again.json().deduped).toBe(true);

    const trail = await app.inject({ method: "GET", url: `/v1/contracts/${contractId}/payments`, headers: { cookie: talent.cookie } });
    expect(trail.json().payments).toHaveLength(2);
  });

  it("rejects forged webhooks and amount tampering", async () => {
    const { client, milestoneId } = await setupContract(app);
    const funded = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/fund`, headers: { cookie: client.cookie } });
    const ref = funded.json().payment.providerRef as string;

    const forged = await app.inject({
      method: "POST",
      url: "/v1/webhooks/paystack",
      headers: { "x-paystack-signature": "nope", "content-type": "application/json" },
      payload: { event: "charge.success", data: { reference: ref, amount: 500000 } },
    });
    expect(forged.statusCode).toBe(401);

    // Tampered amount: verify returns 500000 but webhook claims 1 — verify wins, stays pending.
    const tampered = JSON.stringify({ event: "charge.success", data: { reference: ref, amount: 1, status: "success" } });
    // verify stub always returns 500000, matching the real ledger amount, so craft mismatch instead:
    const db = getDb(TEST_ENV.DATABASE_URL!);
    await db.update(payments).set({ amount: 999 }).where(eq(payments.providerRef, ref));
    const res = await app.inject({
      method: "POST",
      url: "/v1/webhooks/paystack",
      headers: { "x-paystack-signature": sign(tampered), "content-type": "application/json" },
      payload: JSON.parse(tampered),
    });
    expect(res.statusCode).toBe(200);
    const row = (await db.select().from(payments).where(eq(payments.providerRef, ref)).limit(1))[0]!;
    expect(row.status).toBe("pending");
  });

  it("fail-closes without a key and guards access", async () => {
    const { client, milestoneId, contractId } = await setupContract(app);
    const anon = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/fund` });
    expect(anon.statusCode).toBe(401);
    const outsider = await signupAs(app, "payo@sckoll.com", "talent");
    const foreign = await app.inject({ method: "POST", url: `/v1/milestones/${milestoneId}/fund`, headers: { cookie: outsider.cookie } });
    expect(foreign.statusCode).toBe(404);
    const trail = await app.inject({ method: "GET", url: `/v1/contracts/${contractId}/payments`, headers: { cookie: outsider.cookie } });
    expect(trail.statusCode).toBe(404);
  });
});
