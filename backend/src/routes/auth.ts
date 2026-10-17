import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { passwordResetTokens, profiles, users, verificationTokens } from "../db/schema.js";
import type { Env } from "../env.js";
import { resolveSender, sendBrevoEmail } from "../lib/brevo.js";
import { createGoogleVerifier, type VerifyIdToken } from "../lib/google.js";
import { hashPassword, hashToken, newOpaqueToken, normalizeEmail, verifyPassword } from "../lib/password.js";
import {
  clearSessionCookie,
  createSession,
  destroySession,
  publicUser,
  requireAuth,
  resolveSessionUser,
  sessionCookie,
} from "../lib/session.js";
import { resetPasswordTemplate, verifyEmailTemplate, welcomeTemplate } from "../email/templates.js";

const RoleSchema = z.enum(["talent", "client", "both"]);

const SignupSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
  role: RoleSchema.default("talent"),
});

const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

const GoogleSchema = z.object({
  idToken: z.string().min(1),
  role: RoleSchema.optional(),
});

function usernameFromEmail(email: string): string {
  const base = email
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return base || "sckoll_user";
}

async function sendMail(
  env: Env,
  kind: "security" | "hello",
  to: { email: string; name?: string | null },
  content: { subject: string; html: string },
  tags: string[],
): Promise<void> {
  if (!env.BREVO_API_KEY) {
    if (env.NODE_ENV !== "production") {
      console.log(`[mail:off] to=${to.email} subject=${content.subject}`);
    }
    return;
  }
  await sendBrevoEmail({
    apiKey: env.BREVO_API_KEY,
    sender: kind,
    securityFrom: env.BREVO_FROM_SECURITY,
    helloFrom: env.BREVO_FROM_HELLO,
    senderOverride: resolveSender({
      sender: kind,
      senderOverride: undefined,
      securityFrom: env.BREVO_FROM_SECURITY,
      helloFrom: env.BREVO_FROM_HELLO,
    }),
    to: [{ email: to.email, ...(to.name ? { name: to.name } : {}) }],
    subject: content.subject,
    html: content.html,
    tags,
  });
}

export async function registerAuthRoutes(app: FastifyInstance, env: Env, opts?: { googleVerifier?: VerifyIdToken }): Promise<void> {
  const googleVerifier = opts?.googleVerifier ?? createGoogleVerifier(env.GOOGLE_CLIENT_ID);

  app.get("/v1/auth/config", async () => ({
    google_enabled: Boolean(googleVerifier),
    email_password_enabled: true,
  }));

  // POST /v1/auth/signup
  app.post("/v1/auth/signup", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = SignupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
    }
    const email = normalizeEmail(parsed.data.email);
    const db = getDb(env.DATABASE_URL);
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      // Generic response to avoid account enumeration.
      return reply.code(200).send({ ok: true, message: "Check your email to continue." });
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const inserted = await db
      .insert(users)
      .values({ email, name: parsed.data.name.trim(), passwordHash, role: parsed.data.role })
      .returning();
    const user = inserted[0];
    if (!user) return reply.code(500).send({ error: "server_error", message: "Could not create account." });
    await db.insert(profiles).values({ userId: user.id }).onConflictDoNothing();

    const rawToken = newOpaqueToken();
    await db.insert(verificationTokens).values({
      userId: user.id,
      tokenHash: hashToken(env.AUTH_SECRET, rawToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const actionUrl = `${env.SITE_URL.replace(/\/$/, "")}/verify?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;
    await sendMail(env, "security", { email, name: user.name }, verifyEmailTemplate({ name: user.name, actionUrl }), ["verify-email"]);

    const session = await createSession(env, user.id);
    void reply.header("Set-Cookie", sessionCookie(session.token, env.SITE_URL));
    return reply.code(201).send({ ok: true, user: publicUser(user) });
  });

  // POST /v1/auth/login
  app.post("/v1/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: "Invalid email or password." });
    }
    const email = normalizeEmail(parsed.data.email);
    const db = getDb(env.DATABASE_URL);
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    const ok = user?.passwordHash ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
    if (!user || !ok) {
      return reply.code(401).send({ error: "invalid_credentials", message: "Invalid email or password." });
    }
    const session = await createSession(env, user.id);
    void reply.header("Set-Cookie", sessionCookie(session.token, env.SITE_URL));
    return reply.send({ ok: true, user: publicUser(user) });
  });

  // POST /v1/auth/google
  app.post("/v1/auth/google", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request, reply) => {
    if (!googleVerifier) {
      return reply.code(503).send({ error: "google_disabled", message: "Google sign-in is not configured." });
    }
    const parsed = GoogleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_request", message: "A Google ID token is required." });
    }
    let profile;
    try {
      profile = await googleVerifier(parsed.data.idToken);
    } catch {
      return reply.code(401).send({ error: "google_failed", message: "Google sign-in failed." });
    }
    const email = normalizeEmail(profile.email);
    const db = getDb(env.DATABASE_URL);
    let user = (await db.select().from(users).where(eq(users.googleSub, profile.sub)).limit(1))[0];
    if (!user) {
      const byEmail = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (byEmail) {
        // Only auto-link a Google identity when Google confirms the email.
        // An unverified provider email must never attach to an existing account.
        if (!byEmail.googleSub && profile.emailVerified) {
          const updated = await db
            .update(users)
            .set({
              googleSub: profile.sub,
              emailVerified: byEmail.emailVerified || profile.emailVerified,
              name: byEmail.name ?? profile.name ?? null,
              updatedAt: new Date(),
            })
            .where(eq(users.id, byEmail.id))
            .returning();
          user = updated[0] ?? byEmail;
        } else if (!byEmail.googleSub) {
          // Same email, but Google has not verified it: refuse to link or sign in.
          return reply.code(401).send({ error: "google_failed", message: "Google sign-in failed." });
        } else {
          user = byEmail;
        }
      } else {
        const inserted = await db
          .insert(users)
          .values({
            email,
            name: profile.name ?? usernameFromEmail(email),
            googleSub: profile.sub,
            role: parsed.data.role ?? "talent",
            emailVerified: profile.emailVerified,
          })
          .returning();
        user = inserted[0];
        if (user) {
          await db.insert(profiles).values({ userId: user.id }).onConflictDoNothing();
          await sendMail(
            env,
            "hello",
            { email, name: user.name },
            welcomeTemplate({ name: user.name, role: user.role, appUrl: `${env.SITE_URL.replace(/\/$/, "")}/profile/setup` }),
            ["welcome"],
          );
        }
      }
    }
    if (!user) return reply.code(500).send({ error: "server_error", message: "Could not sign in with Google." });
    const session = await createSession(env, user.id);
    void reply.header("Set-Cookie", sessionCookie(session.token, env.SITE_URL));
    return reply.send({ ok: true, user: publicUser(user) });
  });

  // POST /v1/auth/logout
  app.post("/v1/auth/logout", async (request, reply) => {
    await destroySession(env, request);
    void reply.header("Set-Cookie", clearSessionCookie());
    return reply.send({ ok: true });
  });

  // GET /v1/me
  app.get("/v1/me", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const db = getDb(env.DATABASE_URL);
    const profile = (await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1))[0];
    return reply.send({ ok: true, user: publicUser(user), profile: profile ?? null });
  });

  // POST /v1/auth/verify
  app.post(
    "/v1/auth/verify",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = z.object({ token: z.string().min(1), email: z.string().email() }).safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_request", message: "Invalid verification link." });
      const email = normalizeEmail(parsed.data.email);
      const db = getDb(env.DATABASE_URL);
      const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (!user) return reply.code(400).send({ error: "invalid_request", message: "Invalid verification link." });
      const token = (
        await db
          .select()
          .from(verificationTokens)
          .where(and(eq(verificationTokens.userId, user.id), eq(verificationTokens.tokenHash, hashToken(env.AUTH_SECRET, parsed.data.token)), gt(verificationTokens.expiresAt, new Date())))
          .limit(1)
      )[0];
      if (!token) return reply.code(400).send({ error: "invalid_request", message: "This link is invalid or expired." });
      await db.delete(verificationTokens).where(eq(verificationTokens.id, token.id));
      const updated = (await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id)).returning())[0] ?? user;
      await sendMail(
        env,
        "hello",
        { email: user.email, name: user.name },
        welcomeTemplate({ name: user.name, role: user.role, appUrl: `${env.SITE_URL.replace(/\/$/, "")}/profile/setup` }),
        ["welcome"],
      );
      return reply.send({ ok: true, user: publicUser(updated) });
    },
  );

  // POST /v1/auth/resend — new verification link (always generic, no enumeration)
  app.post("/v1/auth/resend", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
    if (!parsed.success) return reply.send({ ok: true });
    const email = normalizeEmail(parsed.data.email);
    const db = getDb(env.DATABASE_URL);
    const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (user && !user.emailVerified) {
      const rawToken = newOpaqueToken();
      await db.insert(verificationTokens).values({
        userId: user.id,
        tokenHash: hashToken(env.AUTH_SECRET, rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const actionUrl = `${env.SITE_URL.replace(/\/$/, "")}/verify?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;
      await sendMail(env, "security", { email, name: user.name }, verifyEmailTemplate({ name: user.name, actionUrl }), ["verify-email"]);
    }
    return reply.send({ ok: true, message: "If that email needs verification, a fresh link is on its way." });
  });

  // POST /v1/auth/forgot + /v1/auth/reset
  app.post("/v1/auth/forgot", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = z.object({ email: z.string().email() }).safeParse(request.body);
    if (!parsed.success) return reply.send({ ok: true });
    const email = normalizeEmail(parsed.data.email);
    const db = getDb(env.DATABASE_URL);
    const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (user) {
      const rawToken = newOpaqueToken();
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hashToken(env.AUTH_SECRET, rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      const actionUrl = `${env.SITE_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;
      await sendMail(env, "security", { email, name: user.name }, resetPasswordTemplate({ actionUrl }), ["reset-password"]);
    }
    return reply.send({ ok: true, message: "If that email exists, a reset link is on its way." });
  });

  app.post("/v1/auth/reset", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = z
      .object({ token: z.string().min(1), email: z.string().email(), password: z.string().min(8).max(128) })
      .safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_request", message: "Invalid reset link." });
    const email = normalizeEmail(parsed.data.email);
    const db = getDb(env.DATABASE_URL);
    const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (!user) return reply.code(400).send({ error: "invalid_request", message: "Invalid reset link." });
    const token = (
      await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, user.id),
            eq(passwordResetTokens.tokenHash, hashToken(env.AUTH_SECRET, parsed.data.token)),
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.usedAt),
          ),
        )
        .limit(1)
    )[0];
    if (!token) return reply.code(400).send({ error: "invalid_request", message: "This link is invalid or expired." });
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, token.id));
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    return reply.send({ ok: true });
  });
}
