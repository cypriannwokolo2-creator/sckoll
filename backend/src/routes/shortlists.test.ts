import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { applications, auditLog, opportunities, passwordResetTokens, profiles, savedSearches, sessions, shortlists, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { testDatabaseUrl } from "../test-setup.js";

const DB = "sckoll_test_shorts";

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
  await db.delete(applications);
  await db.delete(shortlists);
  await db.delete(savedSearches);
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

describe("shortlist + public profile routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    execSync("npx drizzle-kit push", {
      cwd: new URL("../../", import.meta.url).pathname,
      env: { ...process.env, DATABASE_URL: testDatabaseUrl(DB) },
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

  it("shortlists talent with notes, dedupes, and guards ownership", async () => {
    const client = await signupAs(app, "boss@sckoll.com", "client");
    const talent = await signupAs(app, "star@sckoll.com", "talent");
    const db = getDb(TEST_ENV.DATABASE_URL!);
    await db.update(profiles).set({ headline: "Senior backend engineer", skills: ["postgres"], availability: "Immediate", hourlyRate: "$45/hr" }).where(eq(profiles.userId, talent.id));

    const anon = await app.inject({ method: "GET", url: "/v1/shortlists" });
    expect(anon.statusCode).toBe(401);

    const talentShort = await app.inject({
      method: "POST",
      url: "/v1/shortlists",
      headers: { cookie: (await signupAs(app, "other@sckoll.com", "talent")).cookie },
      payload: { talentId: talent.id },
    });
    expect(talentShort.statusCode).toBe(403);

    const created = await app.inject({
      method: "POST",
      url: "/v1/shortlists",
      headers: { cookie: client.cookie },
      payload: { talentId: talent.id, notes: "Strong Postgres background." },
    });
    expect(created.statusCode).toBe(201);

    const dupe = await app.inject({
      method: "POST",
      url: "/v1/shortlists",
      headers: { cookie: client.cookie },
      payload: { talentId: talent.id },
    });
    expect(dupe.statusCode).toBe(200);
    expect(dupe.json().deduped).toBe(true);

    const self = await app.inject({
      method: "POST",
      url: "/v1/shortlists",
      headers: { cookie: client.cookie },
      payload: { talentId: client.id },
    });
    expect(self.statusCode).toBe(400);

    const list = await app.inject({ method: "GET", url: "/v1/shortlists", headers: { cookie: client.cookie } });
    expect(list.json().shortlists).toHaveLength(1);
    expect(list.json().shortlists[0].talent.name).toBe("star");
    expect(list.json().shortlists[0].profile.headline).toBe("Senior backend engineer");
    const entryId = list.json().shortlists[0].id as string;

    const patched = await app.inject({
      method: "PATCH",
      url: `/v1/shortlists/${entryId}`,
      headers: { cookie: client.cookie },
      payload: { notes: "Interview Thursday." },
    });
    expect(patched.json().shortlist.notes).toBe("Interview Thursday.");

    const deleted = await app.inject({ method: "DELETE", url: `/v1/shortlists/${entryId}`, headers: { cookie: client.cookie } });
    expect(deleted.statusCode).toBe(200);
  });

  it("serves public profiles without emails and filters talent search", async () => {
    const client = await signupAs(app, "c2@sckoll.com", "client");
    const talent = await signupAs(app, "pub@sckoll.com", "talent");
    const db = getDb(TEST_ENV.DATABASE_URL!);
    await db.update(profiles).set({ headline: "React specialist", skills: ["react"], availability: "Immediate", hourlyRate: "$30/hr" }).where(eq(profiles.userId, talent.id));

    const pub = await app.inject({ method: "GET", url: `/v1/profiles/${talent.id}` });
    expect(pub.statusCode).toBe(200);
    expect(pub.json().profile.headline).toBe("React specialist");
    expect(JSON.stringify(pub.json())).not.toContain("pub@sckoll.com");

    const missing = await app.inject({ method: "GET", url: "/v1/profiles/00000000-0000-0000-0000-000000000000" });
    expect(missing.statusCode).toBe(404);

    // sitemap index: public, minimal fields, never leaks contact or payout data
    const index = await app.inject({ method: "GET", url: "/v1/profiles?limit=50" });
    expect(index.statusCode).toBe(200);
    const listed = index.json().profiles as Array<Record<string, unknown>>;
    expect(listed.some((p) => p.id === talent.id)).toBe(true);
    expect(JSON.stringify(index.json())).not.toContain("pub@sckoll.com");
    expect(listed[0]).not.toHaveProperty("bio");
    expect(listed[0]).not.toHaveProperty("payoutAccount");
    expect(listed[0]).toHaveProperty("updatedAt");

    const filtered = await app.inject({
      method: "GET",
      url: "/v1/talent/search?skills=react&availability=immediate&rate_max=50",
      headers: { cookie: client.cookie },
    });
    expect(filtered.json().results.length).toBeGreaterThanOrEqual(1);
    expect(filtered.json().total).toBeGreaterThanOrEqual(1);

    const pricey = await app.inject({
      method: "GET",
      url: "/v1/talent/search?rate_max=10",
      headers: { cookie: client.cookie },
    });
    expect(pricey.json().results).toHaveLength(0);
  });
});
