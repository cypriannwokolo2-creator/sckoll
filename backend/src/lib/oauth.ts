import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Helpers for the Google authorization-code flow (redirect + PKCE).
 *
 * Why this file exists: the old flow used the Google Identity Services popup
 * (an implicit ID-token flow). That required the browser's origin to be
 * registered in the Google console, and every failure mode (origin_mismatch,
 * popup blockers, FedCM) surfaced as a dead button. The authorization-code
 * flow only needs a registered *redirect URI* and keeps the token exchange
 * on the server, where it is testable.
 */

export type AuthMode = "sign-in" | "sign-up";
export type SignupRole = "talent" | "client";

/** The auth pages a failed flow may be sent back to. */
export const AUTH_PAGES = ["/sign-in", "/sign-up"] as const;

export interface OAuthStatePayload {
  /** Random nonce, mirrored into a cookie to bind the flow to one browser. */
  n: string;
  /** Which auth page started the flow (where to return on failure). */
  m: AuthMode;
  /** Role chosen on the sign-up page; used only when creating a new user. */
  r: SignupRole;
  /** Expiry, epoch milliseconds. */
  e: number;
}

/** Contents of the HttpOnly cookie that carries the flow's secret parts. */
export interface OAuthCookiePayload {
  /** Same nonce as in the state: binds the callback to this browser. */
  n: string;
  /** PKCE code verifier, never exposed to the browser's JavaScript. */
  v: string;
}

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function mac(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

/**
 * Sign an arbitrary payload so it cannot be forged or edited in transit.
 * Format: base64url(json).base64url(hmac)
 */
export function signPayload(secret: string, payload: unknown): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${mac(secret, body)}`;
}

/**
 * Verify + decode a signed payload. Returns undefined when the signature is
 * wrong or the payload is malformed.
 */
export function verifyPayload<T>(secret: string, signed: string | undefined): T | undefined {
  if (!signed) return undefined;
  const separator = signed.lastIndexOf(".");
  if (separator <= 0) return undefined;
  const body = signed.slice(0, separator);
  const expected = mac(secret, body);
  const a = Buffer.from(signed.slice(separator + 1));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return undefined;
  }
}

/** Sign the state parameter sent through Google. */
export function signState(secret: string, payload: OAuthStatePayload): string {
  return signPayload(secret, payload);
}

/**
 * Verify + decode a state parameter. Returns undefined when the signature is
 * wrong, the payload is malformed, or it has expired.
 */
export function verifyState(secret: string, state: string | undefined, now = Date.now()): OAuthStatePayload | undefined {
  const parsed = verifyPayload<OAuthStatePayload>(secret, state);
  if (!parsed) return undefined;
  if (typeof parsed.n !== "string" || !parsed.n) return undefined;
  if (typeof parsed.e !== "number" || parsed.e <= now) return undefined;
  if (parsed.m !== "sign-in" && parsed.m !== "sign-up") return undefined;
  if (parsed.r !== "talent" && parsed.r !== "client") return undefined;
  return parsed;
}

/** Sign the payload stored in the flow's HttpOnly cookie. */
export function signOAuthCookie(secret: string, payload: OAuthCookiePayload): string {
  return signPayload(secret, payload);
}

/** Verify + decode the flow's cookie payload. */
export function verifyOAuthCookie(secret: string, signed: string | undefined): OAuthCookiePayload | undefined {
  const parsed = verifyPayload<OAuthCookiePayload>(secret, signed);
  if (!parsed) return undefined;
  if (typeof parsed.n !== "string" || !parsed.n) return undefined;
  if (typeof parsed.v !== "string" || !parsed.v) return undefined;
  return parsed;
}

/**
 * Only ever redirect to a known auth page — never to a caller-supplied URL —
 * so the callback cannot be turned into an open redirect.
 */
export function safeFrom(mode: AuthMode | undefined): "/sign-in" | "/sign-up" {
  return mode === "sign-up" ? "/sign-up" : "/sign-in";
}

/**
 * PKCE pair. The verifier stays in an HttpOnly cookie on our own host and is
 * only presented to Google during the code exchange, so a leaked code is
 * useless without it.
 */
export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
