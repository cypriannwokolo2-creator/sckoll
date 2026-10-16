import { describe, expect, it } from "vitest";
import { parseSender, resolveSender, sendBrevoEmail } from "../lib/brevo.js";

function base(overrides: Record<string, unknown> = {}) {
  return {
    apiKey: "k",
    sender: "security" as const,
    securityFrom: "Sckoll <no-reply@sckoll.com>",
    helloFrom: "Sckoll <hello@sckoll.com>",
    to: [{ email: "a@b.co" }],
    subject: "x",
    html: "<p>x</p>",
    ...overrides,
  };
}

describe("brevo sender routing", () => {
  it("routes security + hello to the right verified sender", () => {
    expect(resolveSender(base({ sender: "security" }) as never)).toEqual({
      name: "Sckoll",
      email: "no-reply@sckoll.com",
    });
    expect(resolveSender(base({ sender: "hello" }) as never)).toEqual({
      name: "Sckoll",
      email: "hello@sckoll.com",
    });
  });

  it("parses bare addresses", () => {
    expect(parseSender("hello@sckoll.com")).toEqual({ name: "Sckoll", email: "hello@sckoll.com" });
  });

  it("returns true on 201", async () => {
    let seenUrl = "";
    const ok = await sendBrevoEmail({
      ...base(),
      fetchImpl: (async (url: string) => {
        seenUrl = url;
        return { ok: true, status: 201 };
      }) as never,
    });
    expect(ok).toBe(true);
    expect(seenUrl).toBe("https://api.brevo.com/v3/smtp/email");
  });

  it("stays off without a key", async () => {
    const ok = await sendBrevoEmail({ ...base(), apiKey: "" });
    expect(ok).toBe(false);
  });

  it("returns false on failure", async () => {
    const boom = async (): Promise<never> => {
      throw new Error("down");
    };
    const ok = await sendBrevoEmail({ ...base(), fetchImpl: boom as never });
    expect(ok).toBe(false);
  });
});
