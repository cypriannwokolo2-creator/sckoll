import Fastify, { type FastifyServerOptions } from "fastify";
import { describe, expect, it } from "vitest";
import { genReqId, loggerOptions } from "./logger.js";

describe("loggerOptions", () => {
  it("serializes requests down to id/method/url/ip — never headers or bodies", () => {
    const opts = loggerOptions();
    const serializers = opts.serializers as Record<string, (x: unknown) => unknown>;
    const out = serializers.req!({
      id: "req-1",
      method: "POST",
      url: "/v1/auth/login",
      ip: "203.0.113.9",
      headers: { cookie: "session=top-secret", authorization: "Bearer leak-me" },
      body: { email: "a@b.com", password: "hunter2" },
    }) as Record<string, unknown>;

    expect(out).toEqual({ id: "req-1", method: "POST", url: "/v1/auth/login", ip: "203.0.113.9" });
    const serialized = JSON.stringify(out);
    expect(serialized).not.toContain("top-secret");
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("headers");
  });

  it("serializes responses to the status code only", () => {
    const serializers = loggerOptions().serializers as Record<string, (x: unknown) => unknown>;
    expect(serializers.res!({ statusCode: 401, headers: { "set-cookie": "session=abc" } })).toEqual({ statusCode: 401 });
  });

  it("keeps redaction paths for hand-built objects", () => {
    const opts = loggerOptions("debug") as { level: string; redact: { paths: string[] } };
    expect(opts.level).toBe("debug");
    expect(opts.redact.paths).toContain("req.headers");
    expect(opts.redact.paths).toContain("*.password");
  });

  it("never leaks cookies or authorization through a real Fastify request log", async () => {
    let buffered = "";
    const stream = { write(chunk: string) { buffered += chunk; } };
    const app = Fastify({ logger: { ...loggerOptions(), stream } as FastifyServerOptions["logger"], genReqId });
    app.get("/ping", async () => ({ ok: true }));

    await app.inject({
      method: "GET",
      url: "/ping",
      headers: { cookie: "session=super-secret-cookie", authorization: "Bearer super-secret-bearer", "x-request-id": "trace-42" },
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(buffered).toContain("/ping");
    expect(buffered).toContain("trace-42");
    expect(buffered).not.toContain("super-secret-cookie");
    expect(buffered).not.toContain("super-secret-bearer");

    const lines = buffered.trim().split("\n").map((l) => JSON.parse(l) as { req?: { id?: string; url?: string } });
    const reqLine = lines.find((l) => l.req);
    expect(reqLine?.req?.url).toBe("/ping");
    await app.close();
  });
});

describe("genReqId", () => {
  it("honours a sane inbound id", () => {
    expect(genReqId({ headers: { "x-request-id": "abc-123" } } as never)).toBe("abc-123");
    expect(genReqId({ headers: { "x-request-id": "svc:trace/1.2" } } as never)).toBe("svc:trace/1.2");
  });

  it("mints a fresh id for missing or hostile values", () => {
    const ids = [
      genReqId({ headers: {} } as never),
      genReqId({ headers: { "x-request-id": "<script>alert(1)</script>" } } as never),
      genReqId({ headers: { "x-request-id": "x".repeat(200) } } as never),
    ];
    for (const id of ids) expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(new Set(ids).size).toBe(3);
  });
});
