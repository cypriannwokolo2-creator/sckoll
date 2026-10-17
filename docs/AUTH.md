# Sckoll Authentication — setup & operations

Frontend lives on Vercel (`sckoll.com` / `www.sckoll.com`).
Backend runs on this server behind Traefik at `https://api.sckoll.com`.
Both sign-in methods ship from day one: **email + password** and **Google Sign-In**.

## 1. Environment

Backend env lives in `backend/.env` (gitignored). Start from `backend/.env.example`:

| Key | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Compose overrides to `postgres://sckoll:<POSTGRES_PASSWORD>@db:5432/sckoll` |
| `AUTH_SECRET` | yes | ≥32 chars, session signing salt |
| `GOOGLE_CLIENT_ID` | for Google | Empty = `POST /v1/auth/google` returns `503 google_disabled` (fail-closed) |
| `BREVO_API_KEY` | for mail | Empty = mail stays off; dev logs `[mail:off]` to console |
| `BREVO_FROM_SECURITY` | no | Default `Sckoll <no-reply@sckoll.com>` — verify on sckoll.com in Brevo |
| `BREVO_FROM_HELLO` | no | Default `Sckoll <hello@sckoll.com>` |
| `CONTACT_TO` | no | Inbox for `/v1/contact`; empty = falls back to hello sender |
| `SITE_URL` / `FRONTEND_URL` | yes | `https://www.sckoll.com` in prod, `http://localhost:3000` in dev |

Frontend (Vercel project env):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.sckoll.com` (dev: `http://localhost:8110`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | same Google web client ID as backend |

## 2. Google Cloud setup (one time)

1. Google Cloud Console → APIs & Services → OAuth consent screen → External,
   app name `Sckoll`, homepage `https://www.sckoll.com`, scopes `openid email profile`.
2. Credentials → Create OAuth client ID → Web application.
   Authorized JavaScript origins: `https://www.sckoll.com`, `http://localhost:3000`.
   (ID-token flow — no redirect URIs needed.)
3. Copy the client ID into `GOOGLE_CLIENT_ID` (backend) and
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Vercel).
4. Sanity: `GET /v1/auth/config` → `{ "google_enabled": true, "email_password_enabled": true }`.

## 3. Brevo setup (one time)

1. Brevo → Settings → API keys → create key → `BREVO_API_KEY`.
2. Senders → add & verify `no-reply@sckoll.com` and `hello@sckoll.com`
   (SPF/DKIM via the DNS records Brevo shows).
3. Emails sent: `verify-email` + `reset-password` (security sender),
   `welcome` (hello sender). Tags on every send for Brevo stats.
4. Blank key is safe: sends return `false`, auth still works, nothing throws.

## 4. Endpoints

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | no | liveness |
| `GET` | `/v1/auth/config` | no | feature flags for the UI |
| `POST` | `/v1/auth/signup` | no | `{email,name,password,role}` → 201 + session cookie + verify mail |
| `POST` | `/v1/auth/login` | no | credentials → session cookie |
| `POST` | `/v1/auth/google` | no | `{idToken,role?}` → verify aud → provision/link → session cookie |
| `POST` | `/v1/auth/logout` | cookie | destroy session + clear cookie |
| `GET` | `/v1/me` | cookie | user + profile |
| `POST` | `/v1/auth/verify` | no | `{token,email}` → `email_verified=true` + welcome mail |
| `POST` | `/v1/auth/forgot` | no | always 200 (no enumeration) + reset mail if user exists |
| `POST` | `/v1/auth/reset` | no | single-use token → new password |
| `POST` | `/v1/auth/resend` | no | fresh verification link, always generic 200 |
| `POST` | `/v1/contact` | no | contact form → inbox mail (`CONTACT_TO` or hello sender) |
| `PATCH` | `/v1/profiles/me` | cookie | onboarding / edit profile |
| `GET` | `/v1/talent/search` | cookie | rules-based fit scoring (embeddings later) |

Sessions: opaque 32-byte token, sha256 stored, `sckoll-session` cookie
(`HttpOnly, SameSite=Lax, Secure` on https, 30-day TTL).

## 5. Run it

```bash
cp .env.example .env                 # set POSTGRES_PASSWORD
cp backend/.env.example backend/.env # fill AUTH_SECRET etc.
docker compose up -d --build
cd backend && npm install && npm run db:push
curl https://api.sckoll.com/health
curl https://api.sckoll.com/v1/auth/config
```

DNS needed once: `A api.sckoll.com → <this server>`. Traefik handles TLS.

## 6. Verify auth works

```bash
cd backend && npm test   # brevo routing, password hashing, env fail-closed
```

Manual: sign-up → verify mail → `/v1/me` shows `emailVerified:true` →
login → Google new user provisions + welcome mail → Google existing email links →
wrong password 401 → expired link 400 → blank `GOOGLE_CLIENT_ID` → 503 on google route.
