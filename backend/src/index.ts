import Fastify, { type FastifyError } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { loadEnv, type Env } from "./env.js";
import { isOriginAllowed } from "./lib/cors.js";
import { genReqId, loggerOptions } from "./lib/logger.js";
import { captureError, initSentry } from "./lib/observability.js";
import { registerApplicationRoutes } from "./routes/applications.js";
import { registerContractRoutes } from "./routes/contracts.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerPaymentRoutes } from "./routes/payments.js";
import { registerShortlistRoutes } from "./routes/shortlists.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerContactRoutes } from "./routes/contact.js";
import { registerOpportunityRoutes } from "./routes/opportunities.js";
import { registerProfileRoutes } from "./routes/profiles.js";

export async function buildServer(overrides?: Partial<Env>) {
  const env = { ...loadEnv(), ...overrides };
  initSentry(env.SENTRY_DSN, env.NODE_ENV, env.SENTRY_RELEASE);
  const app = Fastify({
    logger: env.NODE_ENV !== "test" ? loggerOptions(env.LOG_LEVEL) : false,
    genReqId,
    trustProxy: true,
  });

  // Correlation id on every response: what the client saw ↔ what we logged.
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-request-id", String(req.id));
  });

  // Error tracking + the default Fastify error shape (unchanged contract:
  // { statusCode, error, message }) — report first, then reply identically.
  app.setErrorHandler((err: FastifyError & { statusCode?: number }, req, reply) => {
    captureError(err, { route: req.routeOptions?.url ?? "unknown", reqId: String(req.id) });
    reply.code(err.statusCode && err.statusCode >= 400 ? err.statusCode : 500).send(err);
  });

  await app.register(helmet, {
    // API serves JSON to the Vercel frontend; no embedded resources to protect.
    crossOriginResourcePolicy: { policy: "same-site" },
  });
  await app.register(cookie);
  // Keep the raw JSON string for HMAC-verified webhooks (Paystack).
  app.addContentTypeParser("application/json", { parseAs: "string" }, (request, body, done) => {
    try {
      (request as unknown as { rawBody?: string }).rawBody = body as string;
      done(null, JSON.parse(body as string));
    } catch (err) {
      done(err as Error, undefined);
    }
  });
  await app.register(cors, {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin, env)),
    credentials: true,
  });

  // Shared limiter across instances via Redis; memory fallback keeps dev/test alive.
  let redis: Redis | undefined;
  if (env.NODE_ENV !== "test" && env.REDIS_URL) {
    try {
      redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.ping();
    } catch (err) {
      app.log.warn({ err }, "redis unreachable, rate limiter using memory store");
      redis = undefined;
    }
  }
  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
    ...(redis ? { redis } : {}),
  });

  app.get("/health", async () => ({ ok: true, service: "sckoll-api", version: "0.1.0" }));
  // Liveness: process is up; touches no dependency (a bad DB must not "kill" the process).
  app.get("/healthz", async () => ({ ok: true, status: "live" }));
  // Readiness: dependencies are reachable. 503 when degraded — compose healthchecks
  // and the /status page both read this.
  app.get("/readyz", async (_req, reply) => {
    const checks: Record<string, { ok: boolean; latencyMs: number; error?: string }> = {};

    // Probe the *configured* URL with a dedicated short-lived pool: readiness must
    // reflect what this process would actually connect to, not a cached pool.
    const t0 = performance.now();
    const probe = new Pool({ connectionString: env.DATABASE_URL, max: 1, connectionTimeoutMillis: 2000 });
    try {
      await probe.query("SELECT 1");
      checks.database = { ok: true, latencyMs: Math.round(performance.now() - t0) };
    } catch {
      checks.database = { ok: false, latencyMs: Math.round(performance.now() - t0), error: "unreachable" };
      app.log.error({ db: "unreachable" }, "readyz: database unreachable");
    } finally {
      await probe.end();
    }

    if (env.REDIS_URL) {
      const t1 = performance.now();
      let client = redis;
      if (!client) {
        // Limiter connected without redis at boot; probe on demand so readiness
        // still reports the cache accurately instead of silently degrading.
        client = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, reconnectOnError: () => false, retryStrategy: () => null });
      }
      try {
        if (client.status === "wait" || client.status === "close") await client.connect();
        await client.ping();
        checks.redis = { ok: true, latencyMs: Math.round(performance.now() - t1) };
      } catch (err) {
        checks.redis = { ok: false, latencyMs: Math.round(performance.now() - t1), error: "unreachable" };
        app.log.warn({ err }, "readyz: redis unreachable");
      } finally {
        if (client !== redis) client.disconnect();
      }
    }

    const ok = Object.values(checks).every((c) => c.ok);
    reply.code(ok ? 200 : 503);
    return { ok, status: ok ? "ready" : "degraded", checks };
  });

  await registerAuthRoutes(app, env);
  await registerApplicationRoutes(app, env);
  await registerContractRoutes(app, env);
  await registerPaymentRoutes(app, env);
  await registerNotificationRoutes(app, env);
  await registerShortlistRoutes(app, env);
  await registerContactRoutes(app, env);
  await registerOpportunityRoutes(app, env);
  await registerProfileRoutes(app, env);

  app.addHook("onClose", async () => {
    if (redis) {
      redis.disconnect();
    }
    const { closeDb } = await import("./db/client.js");
    await closeDb();
  });

  return { app, env };
}

const isEntry = process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js");
if (isEntry) {
  const { app, env } = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
