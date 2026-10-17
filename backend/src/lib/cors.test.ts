import cors from "@fastify/cors";
import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import type { Env } from "../env.js";
import { isOriginAllowed } from "./cors.js";

const PROD = {
  NODE_ENV: "production",
  FRONTEND_URL: "https://www.sckoll.com",
  SITE_URL: "https://www.sckoll.com",
} as unknown as Env;

const DEV = {
  NODE_ENV: "development",
  FRONTEND_URL: "http://localhost:3000",
  SITE_URL: "http://localhost:3000",
} as unknown as Env;

describe("isOriginAllowed", () => {
  it("allows requests with no Origin (curl, server-to-server)", () => {
    expect(isOriginAllowed(undefined, PROD)).toBe(true);
    expect(isOriginAllowed("", PROD)).toBe(true);
  });

  it("allows the configured app origins", () => {
    expect(isOriginAllowed("https://www.sckoll.com", PROD)).toBe(true);
    expect(isOriginAllowed("http://localhost:3000", DEV)).toBe(true);
  });

  it("refuses everything else in production", () => {
    expect(isOriginAllowed("https://evil.example", PROD)).toBe(false);
    expect(isOriginAllowed("http://localhost:3000", PROD)).toBe(false);
    expect(isOriginAllowed("http://127.0.0.1:3456", PROD)).toBe(false);
    expect(isOriginAllowed("https://sckoll-abc123.vercel.app", PROD)).toBe(false);
    expect(isOriginAllowed("https://www.sckoll.com.evil.example", PROD)).toBe(false);
  });

  it("allows localhost origins outside production (local UI, Playwright e2e)", () => {
    expect(isOriginAllowed("http://localhost:3000", DEV)).toBe(true);
    expect(isOriginAllowed("http://localhost:3456", DEV)).toBe(true);
    expect(isOriginAllowed("http://127.0.0.1:8110", DEV)).toBe(true);
    expect(isOriginAllowed("http://[::1]:3456", DEV)).toBe(true);
    expect(isOriginAllowed("http://evil.example", DEV)).toBe(false);
  });
});

describe("cors plugin wiring", () => {
  it("echoes only allowed origins, with credentials", async () => {
    const app = Fastify();
    await app.register(cors, {
      origin: (origin, cb) => cb(null, isOriginAllowed(origin, PROD)),
      credentials: true,
    });
    app.get("/ping", async () => ({ ok: true }));

    const allowed = await app.inject({ method: "GET", url: "/ping", headers: { origin: "https://www.sckoll.com" } });
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://www.sckoll.com");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const blocked = await app.inject({ method: "GET", url: "/ping", headers: { origin: "https://evil.example" } });
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();
    expect(blocked.headers["access-control-allow-credentials"]).toBeUndefined();

    await app.close();
  });

  it("answers preflight for the configured origin and refuses unknown ones", async () => {
    const app = Fastify();
    await app.register(cors, {
      origin: (origin, cb) => cb(null, isOriginAllowed(origin, PROD)),
      credentials: true,
    });
    app.post("/ping", async () => ({ ok: true }));

    const okPreflight = await app.inject({
      method: "OPTIONS",
      url: "/ping",
      headers: { origin: "https://www.sckoll.com", "access-control-request-method": "POST", "access-control-request-headers": "content-type" },
    });
    expect(okPreflight.statusCode).toBe(204);
    expect(okPreflight.headers["access-control-allow-origin"]).toBe("https://www.sckoll.com");

    const badPreflight = await app.inject({
      method: "OPTIONS",
      url: "/ping",
      headers: { origin: "https://evil.example", "access-control-request-method": "POST" },
    });
    expect(badPreflight.headers["access-control-allow-origin"]).toBeUndefined();

    await app.close();
  });
});
