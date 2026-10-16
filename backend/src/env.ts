import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8110),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().default("redis://localhost:6381"),
  SITE_URL: z.string().url().default("https://www.sckoll.com"),
  FRONTEND_URL: z.string().url().default("https://www.sckoll.com"),
  API_URL: z.string().url().default("https://api.sckoll.com"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  BREVO_API_KEY: z.string().optional().default(""),
  BREVO_FROM_SECURITY: z.string().default("Sckoll <no-reply@sckoll.com>"),
  BREVO_FROM_HELLO: z.string().default("Sckoll <hello@sckoll.com>"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid backend configuration: ${details}`);
  }
  return parsed.data;
}

export function isGoogleConfigured(env: Pick<Env, "GOOGLE_CLIENT_ID">): boolean {
  return env.GOOGLE_CLIENT_ID.trim().length > 0;
}
