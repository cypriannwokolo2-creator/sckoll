import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./env.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerProfileRoutes } from "./routes/profiles.js";

export async function buildServer() {
  const env = loadEnv();
  const app = Fastify({ logger: env.NODE_ENV !== "test" });

  await app.register(cookie);
  await app.register(cors, {
    origin: [env.FRONTEND_URL, env.SITE_URL],
    credentials: true,
  });
  await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });

  app.get("/health", async () => ({ ok: true, service: "sckoll-api", version: "0.1.0" }));

  await registerAuthRoutes(app, env);
  await registerProfileRoutes(app, env);

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
