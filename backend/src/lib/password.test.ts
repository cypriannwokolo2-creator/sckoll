import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, newOpaqueToken, normalizeEmail, sha256Hex, verifyPassword } from "./password.js";

describe("password + tokens", () => {
  it("hashes and verifies, rejects wrong passwords", async () => {
    const hash = await hashPassword("correct-horse-123");
    expect(await verifyPassword("correct-horse-123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("normalizes emails", () => {
    expect(normalizeEmail("  Ada@Sckoll.COM ")).toBe("ada@sckoll.com");
  });

  it("mints unique opaque tokens with stable hashes", () => {
    const a = newOpaqueToken();
    const b = newOpaqueToken();
    expect(a).not.toBe(b);
    expect(sha256Hex(a)).toHaveLength(64);
    expect(sha256Hex(a)).toBe(sha256Hex(a));
  });

  it("peppers token hashes with the secret", () => {
    const token = newOpaqueToken();
    expect(hashToken("secret-a", token)).toHaveLength(64);
    expect(hashToken("secret-a", token)).toBe(hashToken("secret-a", token));
    expect(hashToken("secret-a", token)).not.toBe(hashToken("secret-b", token));
  });
});
