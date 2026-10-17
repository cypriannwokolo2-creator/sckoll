# Runbook — replay a failed Paystack webhook

When: a payment shows "pending" on Sckoll but Paystack charged the client — usually a deploy,
timeout, or restart swallowed the webhook.

## Why replay is safe

`POST /v1/webhooks/paystack` is **idempotent**: processed events are recorded in the
`payment_events` table, and a replayed event id is a no-op. Before anything is trusted, the
API also **re-verifies the charge server-side** (`charge.reference` looked up at Paystack) and
checks the amount — a forged or replayed-but-wrong webhook cannot mark a milestone paid.

Signatures are verified fail-closed: `x-paystack-signature` must be HMAC-SHA512 of the raw
body with the current `PAYSTACK_SECRET_KEY`. That is why replays must come from the Paystack
dashboard (it re-signs) rather than from a hand-rolled curl.

## Steps

1. Find the stuck payment: `https://dashboard.paystack.com/→ Transactions`, or on the box:

   ```bash
   docker compose exec db psql -U sckoll -d sckoll \
     -c "select reference, status, amount_kobo, created_at from payments where status='pending' order by created_at desc limit 5;"
   ```

2. In the Paystack dashboard: **Settings → Webhooks → Event logs** (or the transaction's
   timeline) → find the `charge.success` event → **Resend**.
3. Confirm delivery succeeded in the dashboard (HTTP 2xx from the API).
4. Confirm the ledger moved:

   ```bash
   docker compose exec db psql -U sckoll -d sckoll \
     -c "select reference, status from payments where reference='<ref>';"
   ```

   Status should be `success`, and the milestone/contract balance on the web app should match.

## If replay still fails

- Check the API saw it: `docker compose logs api | grep -i webhook | tail -20` — a
  `401 invalid_signature` means `PAYSTACK_SECRET_KEY` was rotated **after** the event (step 2
  again after fixing `.env`), or `.env` and the container disagree
  (→ `docker compose up -d --force-recreate api`).
- 5xx or timeouts: fix the underlying cause first (see [restart.md](./restart.md)), then
  resend again.
- The webhook is only a fast path: fund/release endpoints also poll verification, so an event
  that never arrives still resolves on the client's next action. Never mark a payment paid by
  hand in the database — money is the ledger's job, not ours.
