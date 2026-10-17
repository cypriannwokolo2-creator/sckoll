import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../index.js";
import type { Env } from "../env.js";
import { loadEnv } from "../env.js";
import { testDatabaseUrl } from "../test-setup.js";

describe("contact route", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const env: Env = {
      ...loadEnv(),
      DATABASE_URL: testDatabaseUrl(),
      AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
      NODE_ENV: "test",
      GOOGLE_CLIENT_ID: "",
      BREVO_API_KEY: "",
    };
    ({ app } = await buildServer(env));
  });

  afterAll(async () => {
    await app.close();
  });

  it("accepts a valid message without mail keys", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/contact",
      payload: { name: "Ada", email: "ada@example.com", topic: "talent", message: "Hello, I need work that fits." },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);
  });

  it("rejects short messages and bad emails", async () => {
    const short = await app.inject({
      method: "POST",
      url: "/v1/contact",
      payload: { name: "Ada", email: "ada@example.com", topic: "talent", message: "hi" },
    });
    expect(short.statusCode).toBe(400);
    const bad = await app.inject({
      method: "POST",
      url: "/v1/contact",
      payload: { name: "Ada", email: "not-an-email", topic: "talent", message: "Hello, I need work that fits." },
    });
    expect(bad.statusCode).toBe(400);
  });
});
