import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { passwordResetTokens, profiles, sessions, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import { loadEnv, type Env } from "../env.js";
import { testDatabaseUrl } from "../test-setup.js";
import { hashToken, newOpaqueToken } from "../lib/password.js";
import type { VerifyIdToken } from "../lib/google.js";

process.env.SCKOLL_TEST_DB ??= "sckoll_test_auth";
const TEST_DATABASE_URL = testDatabaseUrl();
const TEST_SECRET = "test-secret-0123456789abcdef-test-secret";

const TEST_ENV: Partial<Env> = {
  DATABASE_URL: TEST_DATABASE_URL,
  AUTH_SECRET: TEST_SECRET,
  NODE_ENV: "test" as const,
  GOOGLE_CLIENT_ID: "",
  BREVO_API_KEY: "",
};

async function truncate() {
  const db = getDb(TEST_DATABASE_URL);
  await db.delete(passwordResetTokens);
  await db.delete(verificationTokens);
  await db.delete(sessions);
  await db.delete(profiles);
  await db.delete(users);
}

function stubVerifier(profile: { sub: string; email: string; emailVerified: boolean; name?: string }): VerifyIdToken {
  return async () => profile;
}

describe("auth routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    execSync("npx drizzle-kit push", {
      cwd: new URL("../../", import.meta.url).pathname,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: "pipe",
    });
    ({ app } = await buildServer(TEST_ENV));
  }, 120000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncate();
  });

  it("reports google disabled when no client id", async () => {
    const config = await app.inject({ method: "GET", url: "/v1/auth/config" });
    expect(config.json().google_enabled).toBe(false);
    const res = await app.inject({ method: "POST", url: "/v1/auth/google", payload: { idToken: "x" } });
    expect(res.statusCode).toBe(503);
  });

  it("runs the full password loop: signup, me, duplicate, login, wrong pw, logout", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "ada@sckoll.com", name: "Ada", password: "correct-horse-123", role: "talent" },
    });
    expect(signup.statusCode).toBe(201);
    const cookie = signup.headers["set-cookie"];
    expect(cookie).toBeDefined();

    const me = await app.inject({ method: "GET", url: "/v1/me", headers: { cookie: String(cookie).split(";")[0] } });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("ada@sckoll.com");
    expect(me.json().profile).not.toBeNull();

    const dup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "ada@sckoll.com", name: "Ada", password: "correct-horse-123", role: "talent" },
    });
    expect(dup.statusCode).toBe(200);
    expect(dup.json().user).toBeUndefined();

    const bad = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "ada@sckoll.com", password: "nope-nope-nope" },
    });
    expect(bad.statusCode).toBe(401);

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "ada@sckoll.com", password: "correct-horse-123" },
    });
    expect(login.statusCode).toBe(200);
    const loginCookie = String(login.headers["set-cookie"]).split(";")[0];

    const logout = await app.inject({ method: "POST", url: "/v1/auth/logout", headers: { cookie: loginCookie } });
    expect(logout.statusCode).toBe(200);
    const after = await app.inject({ method: "GET", url: "/v1/me", headers: { cookie: loginCookie } });
    expect(after.statusCode).toBe(401);
  });

  it("verifies email with a single-use token", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "vee@sckoll.com", name: "Vee", password: "correct-horse-123", role: "client" },
    });
    const db = getDb(TEST_DATABASE_URL);
    const user = (await db.select().from(users).where(eq(users.email, "vee@sckoll.com")).limit(1))[0];
    const raw = newOpaqueToken();
    await db.insert(verificationTokens).values({
      userId: user.id,
      tokenHash: hashToken(TEST_SECRET, raw),
      expiresAt: new Date(Date.now() + 3600_000),
    });
    const ok = await app.inject({
      method: "POST",
      url: "/v1/auth/verify",
      payload: { token: raw, email: "vee@sckoll.com" },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().user.emailVerified).toBe(true);
    const reuse = await app.inject({
      method: "POST",
      url: "/v1/auth/verify",
      payload: { token: raw, email: "vee@sckoll.com" },
    });
    expect(reuse.statusCode).toBe(400);
  });

  it("resets passwords with single-use tokens and stays silent for unknown emails", async () => {
    const silent = await app.inject({
      method: "POST",
      url: "/v1/auth/forgot",
      payload: { email: "nobody@sckoll.com" },
    });
    expect(silent.statusCode).toBe(200);

    await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "rez@sckoll.com", name: "Rez", password: "old-password-1", role: "talent" },
    });
    const db = getDb(TEST_DATABASE_URL);
    const user = (await db.select().from(users).where(eq(users.email, "rez@sckoll.com")).limit(1))[0];
    const raw = newOpaqueToken();
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(TEST_SECRET, raw),
      expiresAt: new Date(Date.now() + 3600_000),
    });
    const reset = await app.inject({
      method: "POST",
      url: "/v1/auth/reset",
      payload: { token: raw, email: "rez@sckoll.com", password: "new-password-2" },
    });
    expect(reset.statusCode).toBe(200);
    const reuse = await app.inject({
      method: "POST",
      url: "/v1/auth/reset",
      payload: { token: raw, email: "rez@sckoll.com", password: "another-password-3" },
    });
    expect(reuse.statusCode).toBe(400);
    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/login",
      payload: { email: "rez@sckoll.com", password: "new-password-2" },
    });
    expect(login.statusCode).toBe(200);
  });

  it("provisions google users and only links verified emails", async () => {
    const { registerAuthRoutes } = await import("./auth.js");
    const Fastify = (await import("fastify")).default;
    const env: Env = { ...loadEnv(), ...TEST_ENV, GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com" };
    const gapp = Fastify();
    await gapp.register((await import("@fastify/cookie")).default);
    await registerAuthRoutes(gapp, env, {
      googleVerifier: stubVerifier({ sub: "g-1", email: "gigi@sckoll.com", emailVerified: true, name: "Gigi" }),
    });

    const fresh = await gapp.inject({ method: "POST", url: "/v1/auth/google", payload: { idToken: "tok" } });
    expect(fresh.statusCode).toBe(200);
    expect(fresh.json().user.emailVerified).toBe(true);

    // Password account first, then google with UNVERIFIED email: must refuse.
    await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "sam@sckoll.com", name: "Sam", password: "correct-horse-123", role: "talent" },
    });
    const gapp2 = Fastify();
    await gapp2.register((await import("@fastify/cookie")).default);
    await registerAuthRoutes(gapp2, env, {
      googleVerifier: stubVerifier({ sub: "g-2", email: "sam@sckoll.com", emailVerified: false }),
    });
    const refused = await gapp2.inject({ method: "POST", url: "/v1/auth/google", payload: { idToken: "tok" } });
    expect(refused.statusCode).toBe(401);

    // Same email, VERIFIED: links and signs in.
    const gapp3 = Fastify();
    await gapp3.register((await import("@fastify/cookie")).default);
    await registerAuthRoutes(gapp3, env, {
      googleVerifier: stubVerifier({ sub: "g-3", email: "sam@sckoll.com", emailVerified: true, name: "Sam" }),
    });
    const linked = await gapp3.inject({ method: "POST", url: "/v1/auth/google", payload: { idToken: "tok" } });
    expect(linked.statusCode).toBe(200);
    const db = getDb(TEST_DATABASE_URL);
    const sam = (await db.select().from(users).where(eq(users.email, "sam@sckoll.com")).limit(1))[0];
    expect(sam.googleSub).toBe("g-3");
    await gapp.close();
    await gapp2.close();
    await gapp3.close();
  });

  it("resends verification links without enumeration", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "re2@sckoll.com", name: "Re", password: "correct-horse-123", role: "talent" },
    });
    const known = await app.inject({ method: "POST", url: "/v1/auth/resend", payload: { email: "re2@sckoll.com" } });
    expect(known.statusCode).toBe(200);
    const unknown = await app.inject({ method: "POST", url: "/v1/auth/resend", payload: { email: "ghost@sckoll.com" } });
    expect(unknown.statusCode).toBe(200);
    expect(unknown.json()).toEqual(known.json());
  });

  it("guards profile writes behind auth", async () => {
    const anon = await app.inject({ method: "PATCH", url: "/v1/profiles/me", payload: { headline: "x" } });
    expect(anon.statusCode).toBe(401);
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: { email: "pro@sckoll.com", name: "Pro", password: "correct-horse-123", role: "talent" },
    });
    const cookie = String(signup.headers["set-cookie"]).split(";")[0];
    const patch = await app.inject({
      method: "PATCH",
      url: "/v1/profiles/me",
      headers: { cookie },
      payload: { headline: "Senior backend engineer", skills: ["postgres"] },
    });
    expect(patch.statusCode).toBe(200);
    expect(patch.json().profile.headline).toBe("Senior backend engineer");
  });
});
