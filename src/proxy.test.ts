import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { SESSION_HINT_COOKIE } from "@/lib/session-hint";
import { proxy } from "./proxy";

function request(path: string, hint?: string): NextRequest {
  const url = new URL(`https://www.sckoll.com${path}`);
  const req = new NextRequest(url);
  if (hint) req.cookies.set(SESSION_HINT_COOKIE, hint);
  return req;
}

describe("proxy", () => {
  it("sends a member away from the landing page", () => {
    const res = proxy(request("/", "1"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://www.sckoll.com/profile");
  });

  it("leaves a visitor on the landing page", () => {
    const res = proxy(request("/"));

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("ignores every other route", () => {
    const res = proxy(request("/find-work", "1"));

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("keeps the query string out of the redirect", () => {
    const res = proxy(request("/?utm_source=newsletter", "1"));

    expect(res.headers.get("location")).toBe("https://www.sckoll.com/profile");
  });
});
