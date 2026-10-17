/**
 * Origin policy for credentialed CORS.
 *
 * - Configured app URLs (FRONTEND_URL, SITE_URL) are always allowed.
 * - Any localhost/127.0.0.1 origin is allowed outside production so local UIs and
 *   Playwright e2e servers work without config churn.
 * - Everything else is refused: the response simply omits
 *   access-control-allow-origin, so the browser blocks the call.
 */
import type { Env } from "../env.js";

const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function isOriginAllowed(origin: string | undefined | null, env: Env): boolean {
  if (!origin) return true; // curl, server-to-server, same-origin navigations
  if (origin === env.FRONTEND_URL || origin === env.SITE_URL) return true;
  if (env.NODE_ENV !== "production" && LOCALHOST_ORIGIN.test(origin)) return true;
  return false;
}
