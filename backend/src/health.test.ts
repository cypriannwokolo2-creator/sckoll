import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "./index.js";
import { ensureTestDatabase, testDatabaseUrl } from "./test-setup.js";
import type { Env } from "./env.js";

const TEST_DATABASE_URL = testDatabaseUrl();

const baseEnv = (): Env => ({
  ...({} as Env),
  NODE_ENV: "test",
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  DATABASE_URL: TEST_DATABASE_URL,
  REDIS_URL: "", // readiness asserts the dependency-free path; redis checked separately
});

describe("health, readiness and request correlation", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    await ensureTestDatabase(TEST_DATABASE_URL);
    ({ app } = await buildServer(baseEnv()));
  });

  afterAll(async () => {
    await app.close();
  });

  it("healthz is live without touching any dependency", async () => {
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, status: "live" });
  });

  it("readyz reports the database as reachable", async () => {
    const res = await app.inject({ method: "GET", url: "/readyz" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ready");
    expect(body.checks.database.ok).toBe(true);
    expect(body.checks.redis).toBeUndefined(); // REDIS_URL empty → not a dependency here
  });

  it("readyz answers 503 when the database is unreachable", async () => {
    const { app: broken } = await buildServer({ ...baseEnv(), DATABASE_URL: "postgres://sckoll:sckoll@127.0.0.1:9/nope" });
    const res = await broken.inject({ method: "GET", url: "/readyz" });
    expect(res.statusCode).toBe(503);
    const body = res.json();
    expect(body.status).toBe("degraded");
    expect(body.checks.database.ok).toBe(false);
    await broken.close();
  });

  it("echoes an inbound x-request-id and mints one otherwise", async () => {
    const traced = await app.inject({ method: "GET", url: "/healthz", headers: { "x-request-id": "client-abc.123" } });
    expect(traced.headers["x-request-id"]).toBe("client-abc.123");

    const minted = await app.inject({ method: "GET", url: "/healthz" });
    expect(String(minted.headers["x-request-id"])).toMatch(/^[0-9a-f-]{36}$/);

    // Hostile/absurd inbound values are replaced, never reflected verbatim.
    const hostile = await app.inject({ method: "GET", url: "/healthz", headers: { "x-request-id": "<script>alert(1)</script>" } });
    expect(hostile.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});
