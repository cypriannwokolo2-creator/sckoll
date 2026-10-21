import { describe, expect, it } from "vitest";
import {
  createPkce,
  safeFrom,
  signOAuthCookie,
  signPayload,
  signState,
  verifyOAuthCookie,
  verifyPayload,
  verifyState,
  type OAuthStatePayload,
} from "./oauth.js";

const SECRET = "test-secret-0123456789abcdef-test-secret";

function state(overrides: Partial<OAuthStatePayload> = {}): OAuthStatePayload {
  return { n: "nonce-1", m: "sign-in", r: "talent", e: Date.now() + 60_000, ...overrides };
}

describe("oauth state", () => {
  it("round-trips a signed state", () => {
    const signed = signState(SECRET, state());
    const parsed = verifyState(SECRET, signed);
    expect(parsed?.n).toBe("nonce-1");
    expect(parsed?.m).toBe("sign-in");
    expect(parsed?.r).toBe("talent");
  });

  it("rejects a tampered state", () => {
    const signed = signState(SECRET, state());
    const [body] = signed.split(".");
    const forged = Buffer.from(JSON.stringify({ ...state(), r: "client" })).toString("base64url");
    expect(verifyState(SECRET, `${forged}.${signed.split(".")[1]}`)).toBeUndefined();
    expect(verifyState(SECRET, `${body}.deadbeef`)).toBeUndefined();
  });

  it("rejects a state signed with a different secret", () => {
    const signed = signState("another-secret", state());
    expect(verifyState(SECRET, signed)).toBeUndefined();
  });

  it("rejects an expired state", () => {
    const signed = signState(SECRET, state({ e: Date.now() - 1 }));
    expect(verifyState(SECRET, signed)).toBeUndefined();
  });

  it("rejects malformed and missing states", () => {
    expect(verifyState(SECRET, undefined)).toBeUndefined();
    expect(verifyState(SECRET, "")).toBeUndefined();
    expect(verifyState(SECRET, "no-separator")).toBeUndefined();
    expect(verifyState(SECRET, "!!!.!!!")).toBeUndefined();
  });

  it("rejects a state with an unexpected mode or role", () => {
    expect(verifyState(SECRET, signState(SECRET, state({ m: "evil" as never })))).toBeUndefined();
    expect(verifyState(SECRET, signState(SECRET, state({ r: "admin" as never })))).toBeUndefined();
  });
});

describe("oauth cookie payload", () => {
  it("round-trips the nonce and verifier", () => {
    const signed = signOAuthCookie(SECRET, { n: "nonce-9", v: "verifier-9" });
    const parsed = verifyOAuthCookie(SECRET, signed);
    expect(parsed?.n).toBe("nonce-9");
    expect(parsed?.v).toBe("verifier-9");
  });

  it("rejects a tampered cookie payload", () => {
    const signed = signOAuthCookie(SECRET, { n: "nonce-9", v: "verifier-9" });
    expect(verifyOAuthCookie(SECRET, `${signed}x`)).toBeUndefined();
    expect(verifyOAuthCookie(SECRET, undefined)).toBeUndefined();
  });
});

describe("signed payloads", () => {
  it("round-trips and rejects unknown payloads", () => {
    expect(verifyPayload<{ a: number }>(SECRET, signPayload(SECRET, { a: 1 }))?.a).toBe(1);
    expect(verifyPayload(SECRET, "garbage")).toBeUndefined();
  });
});

describe("safeFrom", () => {
  it("maps a mode to the matching auth page", () => {
    expect(safeFrom("sign-in")).toBe("/sign-in");
    expect(safeFrom("sign-up")).toBe("/sign-up");
  });

  it("falls back to sign-in for anything unknown", () => {
    expect(safeFrom(undefined)).toBe("/sign-in");
    expect(safeFrom("evil" as never)).toBe("/sign-in");
  });
});

describe("createPkce", () => {
  it("creates a verifier and a matching challenge", () => {
    const { verifier, challenge } = createPkce();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(challenge).not.toBe(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("does not repeat verifiers", () => {
    expect(createPkce().verifier).not.toBe(createPkce().verifier);
  });
});
