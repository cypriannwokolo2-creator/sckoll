import { createHmac } from "node:crypto";

/**
 * Paystack client (Collections + Transfers). Injectable fetch so the ledger
 * is fully unit-testable without keys. Empty secret = fail-closed: every
 * live-money call throws, webhooks reject.
 *
 * Amounts are in kobo (NGN) or smallest currency unit, integers only —
 * never floats across this boundary.
 */
const BASE = "https://api.paystack.co";

export type FetchImpl = typeof fetch;

export interface PaystackConfig {
  secretKey: string;
  fetchImpl?: FetchImpl;
}

export function isPaystackConfigured(config: Pick<PaystackConfig, "secretKey">): boolean {
  return config.secretKey.trim().length > 0;
}

/** Test hook: stub the transport for route-level tests. Never set in production. */
let testFetch: FetchImpl | undefined;
export function __setPaystackTestFetch(fn: FetchImpl | undefined): void {
  testFetch = fn;
}

function requireKey(config: PaystackConfig): void {
  if (!isPaystackConfigured(config)) {
    throw new Error("paystack_disabled");
  }
}

async function call<T>(
  config: PaystackConfig,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  requireKey(config);
  const res = await (config.fetchImpl ?? testFetch ?? fetch)(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || data.status !== true) {
    throw new Error(`paystack_error: ${data.message ?? `HTTP ${res.status}`}`);
  }
  return data.data as T;
}

/** Initialize a checkout transaction. Returns the authorization URL + reference. */
export async function initializeTransaction(
  config: PaystackConfig,
  input: { email: string; amount: number; currency?: string; reference: string; metadata?: Record<string, unknown> },
): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("paystack_error: amount must be a positive integer in kobo");
  }
  return call(config, "/transaction/initialize", {
    method: "POST",
    body: { email: input.email, amount: input.amount, currency: input.currency ?? "NGN", reference: input.reference, metadata: input.metadata ?? {} },
  });
}

/** Verify a transaction by reference (server-side source of truth). */
export async function verifyTransaction(
  config: PaystackConfig,
  reference: string,
): Promise<{ status: string; amount: number; currency: string; reference: string }> {
  return call(config, `/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Create a transfer recipient (bank account). Returns the recipient code. */
export async function createTransferRecipient(
  config: PaystackConfig,
  input: { type: string; name: string; accountNumber: string; bankCode: string; currency?: string },
): Promise<{ recipient_code: string }> {
  return call(config, "/transferrecipient", {
    method: "POST",
    body: { type: input.type, name: input.name, account_number: input.accountNumber, bank_code: input.bankCode, currency: input.currency ?? "NGN" },
  });
}

/** Initiate a transfer. Idempotent via the reference we generate per release. */
export async function initiateTransfer(
  config: PaystackConfig,
  input: { amount: number; recipient: string; reference: string; reason?: string },
): Promise<{ transfer_code: string; reference: string; status: string }> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("paystack_error: amount must be a positive integer in kobo");
  }
  return call(config, "/transfer", {
    method: "POST",
    body: { source: "balance", amount: input.amount, recipient: input.recipient, reference: input.reference, reason: input.reason ?? "Sckoll milestone release" },
  });
}

/** Verify HMAC-SHA512 webhook signature (fail-closed on mismatch). */
export function verifyWebhookSignature(secretKey: string, rawBody: string, signature: string | undefined): boolean {
  if (!secretKey || !signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
