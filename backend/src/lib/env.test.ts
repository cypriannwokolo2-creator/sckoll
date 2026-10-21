import { describe, expect, it } from "vitest";
import { isGoogleConfigured, loadEnv } from "../env.js";
import { createGoogleClient } from "./google-client.js";

const baseEnv = {
  DATABASE_URL: "postgres://sckoll:sckoll@localhost:5435/sckoll",
  AUTH_SECRET: "0123456789abcdef0123456789abcdef",
};

describe("auth env + google fail-closed", () => {
  it("loads defaults with google disabled", () => {
    const env = loadEnv({ ...process.env, ...baseEnv, GOOGLE_CLIENT_ID: "" });
    expect(isGoogleConfigured(env)).toBe(false);
    expect(
      createGoogleClient({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: env.GOOGLE_REDIRECT_URI,
      }),
    ).toBeUndefined();
  });

  it("enables google when the client id, secret and redirect uri are present", () => {
    const env = loadEnv({ ...process.env, ...baseEnv, GOOGLE_CLIENT_ID: "test.apps.googleusercontent.com" });
    expect(isGoogleConfigured(env)).toBe(false);
    expect(
      createGoogleClient({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectUri: env.GOOGLE_REDIRECT_URI,
      }),
    ).toBeUndefined();
  });

  it("rejects configs without secrets", () => {
    expect(() => loadEnv({ ...process.env, DATABASE_URL: "", AUTH_SECRET: "short" })).toThrow(/Invalid backend configuration/);
  });
});
