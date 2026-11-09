import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { users, type User } from "../db/schema.js";
import type { Env } from "../env.js";
import { hashPassword, normalizeEmail, verifyPassword } from "../lib/password.js";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  publicUser,
  resolveSessionUser,
  sessionCookie,
} from "../lib/session.js";

const SignupSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(6).max(128),
  favoriteTeamId: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

export async function registerAuthRoutes(app: FastifyInstance, env: Env) {
  const db = getDb(env.DATABASE_URL);

  // POST /v1/auth/signup: Sign up as a match streamer fan
  app.post("/v1/auth/signup", async (req, reply) => {
    const parse = SignupSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: "Validation failed", details: parse.error.issues });
    }

    const { email, name, password, favoriteTeamId } = parse.data;
    const cleanEmail = normalizeEmail(email);

    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email: cleanEmail,
        name,
        passwordHash,
        role: "user",
        favoriteTeamId,
        emailVerified: true,
      })
      .returning();

    const { token } = await createSession(env, user.id);
    reply.header("Set-Cookie", sessionCookie(token, env.SITE_URL));
    return reply.code(201).send({ user: publicUser(user) });
  });

  // POST /v1/auth/signin: Log in
  app.post("/v1/auth/signin", async (req, reply) => {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.code(400).send({ error: "Validation failed", details: parse.error.issues });
    }

    const { email, password } = parse.data;
    const cleanEmail = normalizeEmail(email);

    const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const match = await verifyPassword(password, user.passwordHash);
    if (!match) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const { token } = await createSession(env, user.id);
    reply.header("Set-Cookie", sessionCookie(token, env.SITE_URL));
    return { user: publicUser(user) };
  });

  // POST /v1/auth/signout: Sign out
  app.post("/v1/auth/signout", async (req, reply) => {
    await destroySession(env, req);
    reply.header("Set-Cookie", clearSessionCookie());
    return { ok: true };
  });

  // GET /v1/auth/me: Get current logged-in user
  app.get("/v1/auth/me", async (req, reply) => {
    const user = await resolveSessionUser(env, req);
    if (!user) {
      return reply.code(401).send({ error: "Not authenticated" });
    }
    return { user: publicUser(user) };
  });

  // PATCH /v1/auth/profile: Update user profile & favorite team
  app.patch("/v1/auth/profile", async (req, reply) => {
    const user = await resolveSessionUser(env, req);
    if (!user) {
      return reply.code(401).send({ error: "Not authenticated" });
    }

    const schema = z.object({
      name: z.string().min(1).max(120).optional(),
      avatarUrl: z.string().url().optional(),
      favoriteTeamId: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid update data" });
    }

    const [updated] = await db
      .update(users)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return { user: publicUser(updated) };
  });
}
