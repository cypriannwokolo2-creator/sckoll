import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "../db/client.js";
import { passwordResetTokens, profiles, users, verificationTokens, type User } from "../db/schema.js";
import type { Env } from "../env.js";
import { resolveSender, sendBrevoEmail } from "../lib/brevo.js";
import { createGoogleClient, type GoogleClient } from "../lib/google-client.js";
import {
  createPkce,
  OAUTH_STATE_TTL_MS,
  safeFrom,
  signOAuthCookie,
  signState,
  verifyOAuthCookie,
  verifyState,
  type AuthMode,
  type SignupRole,
} from "../lib/oauth.js";
import { hashPassword, hashToken, newOpaqueToken, normalizeEmail, verifyPassword } from "../lib/password.js";
import { notify } from "./notifications.js";
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

const GoogleStartSchema = z.object({
  mode: z.enum(["sign-in", "sign-up"]).default("sign-in"),
  role: z.enum(["talent", "client"]).default("talent"),
});

/** Cookie holding the flow's secret parts (nonce + PKCE verifier). */
const OAUTH_COOKIE = "sckoll-oauth";
/** Cookie lifetime: the whole consent round-trip must fit inside it. */
const OAUTH_COOKIE_TTL_SECONDS = 600;

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

/**
 * Link a Google identity to an existing account, or create a new user.
 *
 * An unverified provider email must never attach to an existing account, so
 * that case is refused outright rather than silently creating a second user.
 */
async function provisionGoogleUser(
  env: Env,
  profile: { sub: string; email: string; emailVerified: boolean; name?: string },
  role: SignupRole,
): Promise<{ ok: true; user: User } | { ok: false; reason: "unverified" | "missing" }> {
  const email = normalizeEmail(profile.email);
  const db = getDb(env.DATABASE_URL);
  let user = (await db.select().from(users).where(eq(users.googleSub, profile.sub)).limit(1))[0];
  if (!user) {
    const byEmail = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (byEmail) {
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
        return { ok: false, reason: "unverified" };
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
          role,
          emailVerified: profile.emailVerified,
        })
        .returning();
      user = inserted[0];
      if (user) {
        await db.insert(profiles).values({ userId: user.id }).onConflictDoNothing();
        await notify(env, {
          type: "user.welcome",
          userId: user.id,
          title: "Welcome to Sckoll",
          body: user.role === "client" ? "Post your first project or search talent." : "Complete your profile and review your matches.",
          link: "/profile/setup",
          requireVerifiedEmail: false,
          email: {
            ...welcomeTemplate({ name: user.name, role: user.role, appUrl: `${env.SITE_URL.replace(/\/$/, "")}/profile/setup` }),
            tags: ["welcome"],
          },
        });
      }
    }
  }
  if (!user) return { ok: false, reason: "missing" };
  return { ok: true, user };
}

export async function registerAuthRoutes(app: FastifyInstance, env: Env, opts?: { googleClient?: GoogleClient }): Promise<void> {
  const googleClient =
    opts?.googleClient ??
    createGoogleClient({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
    });

  app.get("/v1/auth/config", async () => ({
    google_enabled: Boolean(googleClient),
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

  /**
   * GET /v1/auth/google — start the redirect flow.
   *
   * The browser is bounced to Google's consent screen. We keep the two secret
   * parts (a nonce and the PKCE verifier) in an HttpOnly cookie and only put
   * a signed, expiring state parameter in the URL.
   */
  app.get("/v1/auth/google", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request, reply) => {
    if (!googleClient) {
      return reply.code(503).send({ error: "google_disabled", message: "Google sign-in is not configured." });
    }
    const parsed = GoogleStartSchema.safeParse(request.query ?? {});
    const mode: AuthMode = parsed.success ? parsed.data.mode : "sign-in";
    const role: SignupRole = parsed.success ? parsed.data.role : "talent";

    const { verifier, challenge } = createPkce();
    const nonce = randomBytes(16).toString("hex");
    const state = signState(env.AUTH_SECRET, {
      n: nonce,
      m: mode,
      r: role,
      e: Date.now() + OAUTH_STATE_TTL_MS,
    });
    const cookieValue = signOAuthCookie(env.AUTH_SECRET, { n: nonce, v: verifier });

    void reply.header(
      "Set-Cookie",
      `${OAUTH_COOKIE}=${encodeURIComponent(cookieValue)}; Path=/v1/auth; HttpOnly; SameSite=Lax; Max-Age=${OAUTH_COOKIE_TTL_SECONDS}${
        env.SITE_URL.startsWith("https://") ? "; Secure" : ""
      }`,
    );
    return reply.redirect(googleClient.authorizeUrl({ state, codeChallenge: challenge }), 302);
  });

  /**
   * GET /v1/auth/google/callback — finish the redirect flow.
   *
   * Google sends the browser here with ?code=...&state=... (or ?error=...).
   * We exchange the code server-side (the client secret never leaves this
   * host), create the session, and bounce the user back into the app.
   */
  app.get("/v1/auth/google/callback", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (request, reply) => {
    const frontend = env.FRONTEND_URL.replace(/\/$/, "");
    const query = (request.query ?? {}) as { code?: string; state?: string; error?: string };
    const state = verifyState(env.AUTH_SECRET, query.state);
    const failTo = (reason: string) =>
      reply.redirect(`${frontend}${safeFrom(state?.m)}?error=${encodeURIComponent(reason)}`, 302);

    if (!googleClient) return failTo("google_disabled");
    // The user pressed "Cancel" on Google's consent screen.
    if (query.error) return failTo("google_cancelled");
    if (!state) return failTo("google_state");
    if (!query.code) return failTo("google_failed");

    // The cookie proves this callback belongs to the browser that started the
    // flow, and carries the PKCE verifier needed to redeem the code.
    const rawCookie = request.cookies?.[OAUTH_COOKIE];
    const cookie = verifyOAuthCookie(env.AUTH_SECRET, rawCookie ? decodeURIComponent(rawCookie) : undefined);
    if (!cookie || cookie.n !== state.n) return failTo("google_state");

    // Always clear the flow cookie, whatever happens next.
    void reply.header(
      "Set-Cookie",
      `${OAUTH_COOKIE}=; Path=/v1/auth; HttpOnly; SameSite=Lax; Max-Age=0${
        env.SITE_URL.startsWith("https://") ? "; Secure" : ""
      }`,
    );

    let profile;
    try {
      profile = await googleClient.exchangeCode({
        code: query.code,
        codeVerifier: cookie.v,
        redirectUri: env.GOOGLE_REDIRECT_URI,
      });
    } catch {
      return failTo("google_failed");
    }

    const provisioned = await provisionGoogleUser(env, profile, state.r);
    if (!provisioned.ok) {
      return failTo(provisioned.reason === "unverified" ? "google_unverified" : "google_failed");
    }

    const session = await createSession(env, provisioned.user.id);
    void reply.header("Set-Cookie", sessionCookie(session.token, env.SITE_URL));
    return reply.redirect(`${frontend}/profile/setup`, 302);
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
      await notify(env, {
        type: "auth.verified",
        userId: user.id,
        title: "Email confirmed — welcome to Sckoll",
        body: user.role === "client" ? "Post your first project or search talent." : "Complete your profile and review your matches.",
        link: "/profile/setup",
        requireVerifiedEmail: false,
        email: {
          ...welcomeTemplate({ name: user.name, role: user.role, appUrl: `${env.SITE_URL.replace(/\/$/, "")}/profile/setup` }),
          tags: ["welcome"],
        },
      });
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
