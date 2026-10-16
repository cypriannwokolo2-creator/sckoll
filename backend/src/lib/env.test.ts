import { describe, expect, it } from "vitest";
import { isGoogleConfigured, loadEnv } from "../env.js";
import { createGoogleVerifier } from "./google.js";

const baseEnv = {
  DATABASE_URL: "postgres://sckoll:sckoll@localhost:5435/sckoll",
  AUTH_SECRET: "0123456789abcdef0123456789abcdef",
};

describe("auth env + google fail-closed", () => {
  it("loads defaults with google disabled", () => {
    const env = loadEnv({ ...process.env, ...baseEnv, GOOGLE_CLIENT_ID: "" });
    expect(isGoogleConfigured(env)).toBe(false);
    expect(createGoogleVerifier(env.GOOGLE_CLIENT_ID)).toBeUndefined();
  });

  it("enables google when a client id is present", () => {
    const env = loadEnv({ ...process.env, ...baseEnv, GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com" });
    expect(isGoogleConfigured(env)).toBe(true);
    expect(createGoogleVerifier(env.GOOGLE_CLIENT_ID)).toBeDefined();
  });

  it("rejects configs without secrets", () => {
    expect(() => loadEnv({ ...process.env, DATABASE_URL: "", AUTH_SECRET: "short" })).toThrow(/Invalid backend configuration/);
  });
});
