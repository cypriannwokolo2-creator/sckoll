/**
 * A tiny, non-authoritative "you are signed in" hint.
 *
 * The real session cookie is host-only for the API origin (api.sckoll.com),
 * so the web origin cannot read it — not the server, not Proxy. This hint is
 * set by the client once the API confirms a session, and it is what lets the
 * landing page send a member straight to their workspace before any HTML is
 * rendered.
 *
 * It is only ever used for routing decisions. Every protected surface still
 * verifies the real session against the API, so a stale or forged hint can
 * never grant access — it can only send someone to a page that then asks the
 * API who they are.
 */

/** Cookie name (host-only, set on the web origin). */
export const SESSION_HINT_COOKIE = "sckoll-signed-in";

/** Matches the session lifetime (30 days). */
export const SESSION_HINT_MAX_AGE = 60 * 60 * 24 * 30;

/** Where a signed-in visitor belongs. */
export const SIGNED_IN_HOME = "/profile";

function write(value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_HINT_COOKIE}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

/** Record that the API confirmed a session. */
export function markSessionHint(): void {
  write("1", SESSION_HINT_MAX_AGE);
}

/** Forget the hint (on sign-out, or when the API reports no session). */
export function clearSessionHint(): void {
  write("", 0);
}
