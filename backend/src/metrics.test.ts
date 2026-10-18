import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import "./test-setup.js";
import { buildServer } from "./index.js";
import type { Env } from "./env.js";

const TEST_ENV = (): Env => ({
  ...({} as Env),
  NODE_ENV: "test",
  AUTH_SECRET: "test-secret-0123456789abcdef-test-secret",
  DATABASE_URL: "postgres://sckoll:sckoll@127.0.0.1:9/never",
  REDIS_URL: "",
});

describe("prometheus /metrics", () => {
  let app: FastifyInstance;
  let scrape: () => Promise<string>;

  beforeAll(async () => {
    ({ app } = await buildServer(TEST_ENV()));
    // Generate known traffic before the first scrape.
    await app.inject({ method: "GET", url: "/healthz" });
    await app.inject({ method: "GET", url: "/healthz" });
    await app.inject({ method: "GET", url: "/does-not-exist" });
    scrape = async () => (await app.inject({ method: "GET", url: "/metrics" })).body;
  });

  afterAll(async () => {
    await app.close();
  });

  it("serves prometheus text format", async () => {
    const res = await app.inject({ method: "GET", url: "/metrics" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.body).toContain("# TYPE sckoll_http_requests_total counter");
  });

  it("records request counts by route pattern and status", async () => {
    const body = await scrape();
    expect(body).toMatch(/sckoll_http_requests_total\{[^}]*route="\/healthz"[^}]*status="200"[^}]*\} 2/);
    expect(body).toMatch(/sckoll_http_requests_total\{[^}]*route="unmatched"[^}]*status="404"[^}]*\} 1/);
  });

  it("records latency histogram buckets per route (p95 source)", async () => {
    const body = await scrape();
    expect(body).toContain("# TYPE sckoll_http_request_duration_seconds histogram");
    expect(body).toMatch(/sckoll_http_request_duration_seconds_bucket\{[^}]*route="\/healthz"/);
    expect(body).toMatch(/sckoll_http_request_duration_seconds_sum\{[^}]*route="\/healthz"/);
  });

  it("exposes process metrics outside tests only — but never double-registers", async () => {
    // NODE_ENV=test skips collectDefaultMetrics; a second buildServer must not
    // throw "metric already registered" on the shared registry.
    const second = await buildServer(TEST_ENV());
    await second.app.inject({ method: "GET", url: "/metrics" });
    await second.app.close();
    expect((await scrape()).length).toBeGreaterThan(0);
  });
});
