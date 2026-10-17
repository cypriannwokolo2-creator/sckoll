import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Redis } from "ioredis";
import { loadEnv, type Env } from "./env.js";
import { registerApplicationRoutes } from "./routes/applications.js";
import { registerContractRoutes } from "./routes/contracts.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerShortlistRoutes } from "./routes/shortlists.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerContactRoutes } from "./routes/contact.js";
import { registerOpportunityRoutes } from "./routes/opportunities.js";
import { registerProfileRoutes } from "./routes/profiles.js";

export async function buildServer(overrides?: Partial<Env>) {
  const env = { ...loadEnv(), ...overrides };
  const app = Fastify({ logger: env.NODE_ENV !== "test", trustProxy: true });

  await app.register(helmet, {
    // API serves JSON to the Vercel frontend; no embedded resources to protect.
    crossOriginResourcePolicy: { policy: "same-site" },
  });
  await app.register(cookie);
  await app.register(cors, {
    origin: [env.FRONTEND_URL, env.SITE_URL],
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

  await registerAuthRoutes(app, env);
  await registerApplicationRoutes(app, env);
  await registerContractRoutes(app, env);
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
