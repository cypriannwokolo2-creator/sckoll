import type { FastifyReply, FastifyRequest } from "fastify";
import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { sessions, users, type User } from "../db/schema.js";
import { hashToken } from "./password.js";
import type { Env } from "../env.js";

export const SESSION_COOKIE = "sckoll-session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function sessionCookie(token: string, siteUrl: string, maxAge = SESSION_TTL_SECONDS): string {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (siteUrl.startsWith("https://")) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionToken(request: FastifyRequest): string | undefined {
  const raw = request.cookies?.[SESSION_COOKIE];
  return raw ? decodeURIComponent(raw) : undefined;
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(env: Env, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = newSessionToken();
  const db = getDb(env.DATABASE_URL);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(env.AUTH_SECRET, token), expiresAt });
  return { token, expiresAt };
}

export async function resolveSessionUser(env: Env, request: FastifyRequest): Promise<User | undefined> {
  const token = getSessionToken(request);
  if (!token) return undefined;
  try {
    const db = getDb(env.DATABASE_URL);
    const rows = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.tokenHash, hashToken(env.AUTH_SECRET, token)), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return rows[0]?.user;
  } catch {
    return undefined;
  }
}

export async function destroySession(env: Env, request: FastifyRequest): Promise<void> {
  const token = getSessionToken(request);
  if (!token) return;
  try {
    const db = getDb(env.DATABASE_URL);
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(env.AUTH_SECRET, token)));
  } catch {
    // best effort
  }
}

export function publicUser(user: User): {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
} {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export function requireAuth(reply: FastifyReply, user: User | undefined): user is User {
  if (!user) {
    void reply.code(401).send({ error: "unauthorized", message: "Sign in to continue." });
    return false;
  }
  return true;
}
