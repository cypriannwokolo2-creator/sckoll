import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_HINT_COOKIE,
  SESSION_HINT_MAX_AGE,
  SIGNED_IN_HOME,
  clearSessionHint,
  markSessionHint,
} from "./session-hint";

function readCookie(): string {
  return document.cookie;
}

afterEach(() => {
  document.cookie = `${SESSION_HINT_COOKIE}=; Path=/; Max-Age=0`;
  vi.restoreAllMocks();
});

describe("session hint", () => {
  it("writes a hint the proxy can read", () => {
    markSessionHint();

    expect(readCookie()).toContain(`${SESSION_HINT_COOKIE}=1`);
  });

  it("clears the hint", () => {
    markSessionHint();
    clearSessionHint();

    expect(readCookie()).not.toContain(`${SESSION_HINT_COOKIE}=1`);
  });

  it("scopes the hint to the site with a 30-day lifetime", () => {
    const spy = vi.spyOn(document, "cookie", "set");
    markSessionHint();

    const written = spy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(written).toContain("Path=/");
    expect(written).toContain("SameSite=Lax");
    expect(written).toContain(`Max-Age=${SESSION_HINT_MAX_AGE}`);
    // A hint must never be readable as a session by the API.
    expect(written).not.toContain("HttpOnly");
  });

  it("points members at the workspace", () => {
    expect(SIGNED_IN_HOME).toBe("/profile");
  });
});
