import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "../db/client.js";
import { auditLog, contractFlags, contracts, milestones, payments, profiles, users } from "../db/schema.js";
import type { Env } from "../env.js";
import { notify } from "./notifications.js";
import { createTransferRecipient, initiateTransfer, initializeTransaction, isPaystackConfigured, verifyTransaction, verifyWebhookSignature } from "../lib/paystack.js";
import { requireAuth, resolveSessionUser } from "../lib/session.js";
import { paymentReceiptTemplate } from "../email/templates.js";

/**
 * Paystack-first money movement (T251+). Ledger-first: every intent is a
 * row before any provider call; webhooks + verify calls are the source of
 * truth; releases only fire for approved milestones with held funds.
 * Flutterwave adapter slots into the provider field later.
 */

function paystackEnv(env: Env) {
  const extra = env as Env & { PAYSTACK_SECRET_KEY?: string };
  return { secretKey: process.env.PAYSTACK_SECRET_KEY ?? extra.PAYSTACK_SECRET_KEY ?? "" };
}

async function logAction(env: Env, actorId: string | undefined, action: string, targetId: string) {
  try {
    await getDb(env.DATABASE_URL).insert(auditLog).values({ actorId, action, targetType: "payment", targetId });
  } catch {
    // best-effort
  }
}

async function receiptMail(
  env: Env,
  userId: string,
  kind: "fund" | "release" | "refund",
  input: { amount: number; currency: string; milestoneTitle?: string; reference: string },
) {
  const titles = { fund: "Milestone funded", release: "Milestone released", refund: "Payment refunded" } as const;
  await notify(env, {
    type: "payment.receipt",
    userId,
    title: `${titles[kind]} — ${input.currency} ${(input.amount / 100).toLocaleString()}`,
    body: input.milestoneTitle ?? input.reference,
    link: "/contracts",
    email: {
      ...paymentReceiptTemplate({ kind, amount: input.amount, currency: input.currency, reference: input.reference }),
      tags: [`payment-${kind}`],
    },
  });
}

export async function registerPaymentRoutes(app: FastifyInstance, env: Env): Promise<void> {
  const cfg = () => paystackEnv(env);

  // POST /v1/milestones/:id/fund — client funds a milestone (checkout URL)
  app.post(
    "/v1/milestones/:id/fund",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const stone = (await db.select().from(milestones).where(eq(milestones.id, id)).limit(1))[0];
      if (!stone) return reply.code(404).send({ error: "not_found", message: "Milestone not found." });
      const row = (await db.select().from(contracts).where(eq(contracts.id, stone.contractId)).limit(1))[0];
      if (!row || row.clientId !== user.id) {
        return reply.code(404).send({ error: "not_found", message: "Milestone not found." });
      }
      if (row.status !== "active") {
        return reply.code(409).send({ error: "closed", message: "Only active contracts can be funded." });
      }
      if (stone.amount == null || stone.amount <= 0) {
        return reply.code(400).send({ error: "invalid_request", message: "Set a milestone amount before funding." });
      }
      if (!isPaystackConfigured(cfg())) {
        return reply.code(503).send({ error: "payments_disabled", message: "Payments are not connected yet." });
      }
      const idempotencyKey = `fund:${stone.id}:${stone.amount}`;
      const existing = (await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey)).limit(1))[0];
      if (existing) {
        return reply.send({ ok: true, payment: existing, deduped: true });
      }
      const reference = `sckoll-fund-${stone.id.slice(0, 8)}-${randomBytes(6).toString("hex")}`;
      let init;
      try {
        init = await initializeTransaction(cfg(), {
          email: user.email,
          amount: stone.amount,
          currency: "NGN",
          reference,
          metadata: { milestone_id: stone.id, contract_id: row.id },
        });
      } catch (e) {
        return reply.code(502).send({ error: "provider_error", message: e instanceof Error ? e.message : "Provider failed." });
      }
      const inserted = (
        await db
          .insert(payments)
          .values({
            contractId: row.id,
            milestoneId: stone.id,
            direction: "in",
            amount: stone.amount,
            currency: "NGN",
            provider: "paystack",
            providerRef: init.reference,
            idempotencyKey,
            status: "pending",
          })
          .returning()
      )[0];
      await logAction(env, user.id, "payment.fund_init", inserted?.id ?? reference);
      return reply.code(201).send({ ok: true, payment: inserted, authorizationUrl: init.authorization_url });
    },
  );

  // GET /v1/contracts/:id/payments — parties see the money trail
  app.get("/v1/contracts/:id/payments", async (request, reply) => {
    const user = await resolveSessionUser(env, request);
    if (!requireAuth(reply, user)) return;
    const { id } = request.params as { id: string };
    const db = getDb(env.DATABASE_URL);
    const row = (await db.select().from(contracts).where(eq(contracts.id, id)).limit(1))[0];
    if (!row || (row.clientId !== user.id && row.talentId !== user.id)) {
      return reply.code(404).send({ error: "not_found", message: "Contract not found." });
    }
    const rows = await db.select().from(payments).where(eq(payments.contractId, id)).orderBy(desc(payments.createdAt));
    return reply.send({ ok: true, payments: rows });
  });

  // POST /v1/milestones/:id/release — client releases held funds to talent
  app.post(
    "/v1/milestones/:id/release",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const user = await resolveSessionUser(env, request);
      if (!requireAuth(reply, user)) return;
      const { id } = request.params as { id: string };
      const db = getDb(env.DATABASE_URL);
      const stone = (await db.select().from(milestones).where(eq(milestones.id, id)).limit(1))[0];
      if (!stone) return reply.code(404).send({ error: "not_found", message: "Milestone not found." });
      const row = (await db.select().from(contracts).where(eq(contracts.id, stone.contractId)).limit(1))[0];
      if (!row || row.clientId !== user.id) {
        return reply.code(404).send({ error: "not_found", message: "Milestone not found." });
      }
      if (stone.status !== "approved") {
        return reply.code(400).send({ error: "invalid_request", message: "Only approved milestones can be released." });
      }
      const held = (
        await db
          .select()
          .from(payments)
          .where(and(eq(payments.milestoneId, stone.id), eq(payments.direction, "in"), eq(payments.status, "held")))
          .limit(1)
      )[0];
      if (!held) {
        return reply.code(400).send({ error: "unfunded", message: "Fund this milestone before releasing." });
      }
      const talentProfile = (await db.select().from(profiles).where(eq(profiles.userId, row.talentId)).limit(1))[0];
      const payout = talentProfile?.payoutAccount;
      if (!payout?.bankCode || !payout?.accountNumber) {
        return reply.code(400).send({ error: "no_payout_account", message: "Talent has not added payout details yet." });
      }
      if (!isPaystackConfigured(cfg())) {
        return reply.code(503).send({ error: "payments_disabled", message: "Payments are not connected yet." });
      }
      const idempotencyKey = `release:${stone.id}:${held.id}`;
      const dup = (await db.select().from(payments).where(eq(payments.idempotencyKey, idempotencyKey)).limit(1))[0];
      if (dup) return reply.send({ ok: true, payment: dup, deduped: true });
      try {
        const recipient = await createTransferRecipient(cfg(), {
          type: "nuban",
          name: payout.accountName ?? "Sckoll talent",
          accountNumber: payout.accountNumber,
          bankCode: payout.bankCode,
          currency: "NGN",
        });
        const transfer = await initiateTransfer(cfg(), {
          amount: held.amount,
          recipient: recipient.recipient_code,
          reference: `sckoll-release-${stone.id.slice(0, 8)}-${randomBytes(6).toString("hex")}`,
          reason: `Sckoll milestone: ${stone.title.slice(0, 60)}`,
        });
        const out = (
          await db
            .insert(payments)
            .values({
              contractId: row.id,
              milestoneId: stone.id,
              direction: "out",
              amount: held.amount,
              currency: held.currency,
              provider: "paystack",
              providerRef: transfer.reference,
              idempotencyKey,
              status: transfer.status === "success" ? "released" : "pending",
            })
            .returning()
        )[0];
        await logAction(env, user.id, "payment.release", out?.id ?? idempotencyKey);
        await receiptMail(env, row.talentId, "release", { amount: held.amount, currency: held.currency, milestoneTitle: stone.title, reference: transfer.reference });
        return reply.code(201).send({ ok: true, payment: out });
      } catch (e) {
        return reply.code(502).send({ error: "provider_error", message: e instanceof Error ? e.message : "Provider failed." });
      }
    },
  );

  // POST /v1/webhooks/paystack — signature-verified, idempotent
  app.post("/v1/webhooks/paystack", async (request, reply) => {
    const raw = ((request as unknown as { rawBody?: string }).rawBody ?? JSON.stringify(request.body ?? "")) as string;
    const signature = request.headers["x-paystack-signature"] as string | undefined;
    if (!verifyWebhookSignature((cfg().secretKey ?? "") as string, raw, signature)) {
      return reply.code(401).send({ error: "invalid_signature", message: "Bad webhook signature." });
    }
    const event = request.body as { event?: string; data?: { reference?: string; amount?: number; status?: string } };
    const db = getDb(env.DATABASE_URL);
    if (event.event === "charge.success" && event.data?.reference) {
      const payment = (await db.select().from(payments).where(eq(payments.providerRef, event.data.reference)).limit(1))[0];
      if (payment && payment.status === "pending") {
        // Server-side verify + amount check before trusting the webhook.
        try {
          const verified = await verifyTransaction(cfg(), event.data.reference);
          if (verified.status === "success" && verified.amount === payment.amount) {
            await db.update(payments).set({ status: "held", updatedAt: new Date() }).where(eq(payments.id, payment.id));
            await logAction(env, undefined, "payment.held", payment.id);
            const cRow = (await db.select().from(contracts).where(eq(contracts.id, payment.contractId)).limit(1))[0];
            if (cRow) {
              await receiptMail(env, cRow.clientId, "fund", {
                amount: payment.amount,
                currency: payment.currency,
                reference: payment.providerRef ?? event.data.reference,
              });
            }
          }
        } catch {
          // verification failed — leave pending
        }
      }
      return reply.send({ ok: true });
    }
    if ((event.event === "transfer.success" || event.event === "transfer.failed" || event.event === "transfer.reversed") && event.data?.reference) {
      const payment = (await db.select().from(payments).where(eq(payments.providerRef, event.data.reference)).limit(1))[0];
      if (payment && payment.status === "pending") {
        await db
          .update(payments)
          .set({ status: event.event === "transfer.success" ? "released" : "failed", updatedAt: new Date() })
          .where(eq(payments.id, payment.id));
        await logAction(env, undefined, `payment.${event.event}`, payment.id);
      }
      return reply.send({ ok: true });
    }
    return reply.send({ ok: true, ignored: true });
  });
}
