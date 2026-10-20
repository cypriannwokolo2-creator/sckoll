# Runbook — rotate secrets

When: a secret may have leaked, on a schedule (quarterly), or after staff/tooling changes.

## What lives where

| Secret | Where it lives | Consumers |
|---|---|---|
| `AUTH_SECRET` | `backend/.env` (host box) | API session signing |
| `PAYSTACK_SECRET_KEY` | `backend/.env` | Paystack charges + webhook verification |
| `GOOGLE_CLIENT_ID` / `SECRET` | `backend/.env` | Google sign-in |
| `BREVO_API_KEY` | `backend/.env` | transactional mail |
| `DATABASE_URL` password | `backend/.env` + compose `.env` (`POSTGRES_PASSWORD`) | API, seeds, CI uses its own |
| Vercel env (`NEXT_PUBLIC_API_URL`, …) | Vercel project settings | frontend build |

## Rotation procedure (backend secrets)

1. Create the new secret with the provider (new Paystack key in the dashboard, new Google
   client, etc.). Keep the old one valid until step 4 passes.
2. Edit `backend/.env` on the box; update both old and new values in place.
3. `docker compose up -d --force-recreate api` — env changes need a recreate, not a restart.
4. Verify: `/readyz` → `ready`, one real flow end-to-end (login, or a Paystack **test-mode**
   charge if the key changed), and `docker compose logs api | tail` for config errors.

## Special cases

- **`AUTH_SECRET`**: sessions are signed with it. Rotating it **logs everyone out**. Say so
  before you rotate; do it in a low-traffic window.
- **Database password**: change inside Postgres first
  (`ALTER ROLE sckoll WITH PASSWORD '…';`), then `.env`, then recreate `api`. The `db`
  container keeps its own `POSTGRES_PASSWORD` init; existing data is unaffected.
- **Vercel env**: update in project settings, then redeploy (`master` push or "Redeploy") —
  `NEXT_PUBLIC_*` values are baked at build time.
- **Google client** (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`): reissue the OAuth client
  in the console, update both lines in `backend/.env`, recreate `api` — full procedure and
  the exact console fields in `docs/runbooks/google-signin.md`. Sessions are unaffected.

## After rotation

Commit nothing secret to git. `.env` stays gitignored (only `.env.example` is tracked); the
runbook is the record that the procedure exists, not the values.
