import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  __setPaystackTestFetch,
  createTransferRecipient,
  initializeTransaction,
  initiateTransfer,
  isPaystackConfigured,
  verifyTransaction,
  verifyWebhookSignature,
} from "./paystack.js";

function stubFetch(responses: Record<string, unknown>) {
  return (async (url: string) => {
    const path = String(url).replace("https://api.paystack.co", "");
    const data = responses[path] ?? { status: false, message: "not stubbed" };
    const ok = (data as { status?: boolean }).status === true;
    return { ok, status: ok ? 200 : 400, json: async () => data };
  }) as never;
}

describe("paystack client", () => {
  it("fail-closes without a key", async () => {
    expect(isPaystackConfigured({ secretKey: "" })).toBe(false);
    await expect(initializeTransaction({ secretKey: "" }, { email: "a@b.co", amount: 100, reference: "r" })).rejects.toThrow("paystack_disabled");
    await expect(verifyTransaction({ secretKey: "  " }, "r")).rejects.toThrow("paystack_disabled");
  });

  it("rejects non-integer amounts before any network call", async () => {
    let called = false;
    const cfg = { secretKey: "sk_test", fetchImpl: (async () => { called = true; return { ok: true, status: 200, json: async () => ({ status: true, data: {} }) }; }) as never };
    await expect(initializeTransaction(cfg, { email: "a@b.co", amount: 10.5, reference: "r" })).rejects.toThrow("positive integer");
    await expect(initiateTransfer(cfg, { amount: 0, recipient: "RCP", reference: "r" })).rejects.toThrow("positive integer");
    expect(called).toBe(false);
  });

  it("initializes, verifies, and transfers with stubbed transport", async () => {
    const cfg = {
      secretKey: "sk_test",
      fetchImpl: stubFetch({
        "/transaction/initialize": { status: true, data: { authorization_url: "https://checkout.paystack.com/x", access_code: "a", reference: "ref-1" } },
        "/transaction/verify/ref-1": { status: true, data: { status: "success", amount: 5000, currency: "NGN", reference: "ref-1" } },
        "/transferrecipient": { status: true, data: { recipient_code: "RCP_1" } },
        "/transfer": { status: true, data: { transfer_code: "TRF_1", reference: "rel-1", status: "success" } },
      }),
    };
    const init = await initializeTransaction(cfg, { email: "a@b.co", amount: 5000, reference: "ref-1" });
    expect(init.authorization_url).toContain("paystack.com");
    const verified = await verifyTransaction(cfg, "ref-1");
    expect(verified.amount).toBe(5000);
    const rcp = await createTransferRecipient(cfg, { type: "nuban", name: "Ada", accountNumber: "0123456789", bankCode: "058" });
    expect(rcp.recipient_code).toBe("RCP_1");
    const trf = await initiateTransfer(cfg, { amount: 5000, recipient: "RCP_1", reference: "rel-1" });
    expect(trf.status).toBe("success");
  });

  it("surfaces provider errors", async () => {
    const cfg = { secretKey: "sk_test", fetchImpl: stubFetch({ "/transaction/verify/bad": { status: false, message: "Invalid reference" } }) };
    await expect(verifyTransaction(cfg, "bad")).rejects.toThrow("Invalid reference");
  });

  it("verifies webhook signatures in constant time", () => {
    const secret = "whsec";
    const raw = '{"event":"charge.success"}';
    const sig = createHmac("sha512", secret).update(raw, "utf8").digest("hex");
    expect(verifyWebhookSignature(secret, raw, sig)).toBe(true);
    expect(verifyWebhookSignature(secret, raw, sig.slice(0, -1) + "0")).toBe(false);
    expect(verifyWebhookSignature(secret, raw, undefined)).toBe(false);
    expect(verifyWebhookSignature("", raw, sig)).toBe(false);
  });

  it("exposes a test transport hook", () => {
    __setPaystackTestFetch(undefined);
  });
});
