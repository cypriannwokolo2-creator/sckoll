import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { passwordResetTokens, sessions, users, verificationTokens } from "../db/schema.js";
import { buildServer } from "../index.js";
import { loadEnv, type Env } from "../env.js";
import { pushSchema, testDatabaseUrl } from "../test-setup.js";

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
  await db.delete(users);
}

describe("Auth Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await pushSchema(TEST_DATABASE_URL);
    const built = await buildServer(TEST_ENV);
    app = built.app;
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncate();
  });

  it("registers a new fan and sets a session cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: "fan@sckoll.com",
        name: "Gunner_Fan",
        password: "secretpassword123",
        favoriteTeamId: "arsenal",
      },
    });

    if (res.statusCode !== 201) {
      console.log("SIGNUP ERROR:", res.body);
    }
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe("fan@sckoll.com");
    expect(body.user.name).toBe("Gunner_Fan");
    expect(body.user.favoriteTeamId).toBe("arsenal");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("authenticates existing user with signin", async () => {
    // First signup
    await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: "fan2@sckoll.com",
        name: "Madridista",
        password: "securepassword456",
      },
    });

    // Then signin
    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signin",
      payload: {
        email: "fan2@sckoll.com",
        password: "securepassword456",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe("fan2@sckoll.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects invalid passwords", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/auth/signup",
      payload: {
        email: "fan3@sckoll.com",
        name: "CelticsFan",
        password: "password123",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: "/v1/auth/signin",
      payload: {
        email: "fan3@sckoll.com",
        password: "wrongpassword",
      },
    });

    expect(res.statusCode).toBe(401);
  });
});
