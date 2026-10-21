import { NextResponse, type NextRequest } from "next/server";
import { SESSION_HINT_COOKIE, SIGNED_IN_HOME } from "@/lib/session-hint";

/**
 * Signed-in visitors do not belong on the marketing landing page: send them
 * to their workspace before a single byte of the landing page is rendered.
 *
 * The check is optimistic (a cookie hint, no database round-trip) — the
 * workspace it leads to verifies the real session against the API, so a
 * stale hint can at worst send someone to a page that asks them to sign in.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== "/") return NextResponse.next();

  const hint = request.cookies.get(SESSION_HINT_COOKIE)?.value;
  if (!hint) return NextResponse.next();

  const target = request.nextUrl.clone();
  target.pathname = SIGNED_IN_HOME;
  target.search = "";
  return NextResponse.redirect(target, 307);
}

export const config = {
  // Only the landing page — every other route is left alone.
  matcher: "/",
};
