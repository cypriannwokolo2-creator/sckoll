import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "./test-setup.js"; // loads backend/.env so buildServer's loadEnv() validates
import { buildServer } from "./index.js";
import { initSentry } from "./lib/observability.js";
import type { Env } from "./env.js";

const TEST_ENV = (): Env => ({
  ...({} as Env),
  NODE_ENV: "test",
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  DATABASE_URL: "postgres://sckoll:sckoll@127.0.0.1:9/never", // never contacted
  REDIS_URL: "",
  SENTRY_DSN: "",
});

describe("error tracking (DSN-driven, fail-silent)", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    ({ app } = await buildServer(TEST_ENV()));
    app.get("/boom", async () => {
      throw new Error("kaboom");
    });
    app.get("/gone", async () => {
      const err = new Error("nope") as Error & { statusCode: number };
      err.statusCode = 410;
      throw err;
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("keeps the default Fastify error contract when an unexpected error throws", async () => {
    const res = await app.inject({ method: "GET", url: "/boom" });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ statusCode: 500, error: "Internal Server Error", message: "kaboom" });
  });

  it("still routes httpErrors to their own status codes", async () => {
    const res = await app.inject({ method: "GET", url: "/gone" });
    expect(res.statusCode).toBe(410);
    expect(res.json().message).toBe("nope");
  });

  it("emits x-request-id even on error responses (correlation during incidents)", async () => {
    const res = await app.inject({ method: "GET", url: "/boom" });
    expect(String(res.headers["x-request-id"])).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("initSentry guard", () => {
  it("is a no-op without a DSN and initialises with one", () => {
    expect(initSentry("", "test")).toBe(false);
    // Initialises the in-process SDK against an unroutable port; nothing is
    // captured, so no network I/O happens. Validates the DSN-driven guard.
    expect(initSentry("http://publickey@127.0.0.1:9/1", "test")).toBe(true);
  });
});
