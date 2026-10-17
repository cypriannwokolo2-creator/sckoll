import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Opaque session / token secret shown once; only sha256 is stored. */
export function newOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * Peppered token hash for sessions + single-use tokens. Binds stored hashes
 * to AUTH_SECRET so a DB dump alone is not enough to offline-match tokens,
 * and secret rotation invalidates every outstanding token at once.
 */
export function hashToken(secret: string, token: string): string {
  return createHash("sha256").update(`${secret}:${token}`, "utf8").digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
