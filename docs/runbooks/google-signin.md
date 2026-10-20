# Runbook — Google sign-in activation

Sckoll uses the **Google Identity Services button** (ID-token flow): the browser
receives a signed ID token, and the API verifies signature, audience and issuer
against Google's public keys (`backend/src/lib/google.ts`). No redirect ever
hits our servers, and **no client secret is needed to sign in** — the secret
from the console is kept server-side as policy (and for any future
authorization-code flow).

## 1. Google Cloud Console → Credentials → OAuth client ID (Web application)

| Console field | Value |
|---|---|
| Authorized JavaScript origins | `https://www.sckoll.com` (+ `http://127.0.0.1:3000` for local dev) |
| Authorized redirect URIs | **not used by this flow** — leave empty (Google allows it; the button never redirects) |

Copy the **Client ID** (ends with `.apps.googleusercontent.com`) and the
**Client secret** (`GOCSPX-…`).

## 2. Where each value goes (never in git)

| Value | Where | Why |
|---|---|---|
| Client ID | box `backend/.env` → `GOOGLE_CLIENT_ID=` | API verifies the token audience against it; `/v1/auth/config` flips `google_enabled` |
| Client secret | box `backend/.env` → `GOOGLE_CLIENT_SECRET=` | server-only: never returned by any route, never logged (logger serializers emit id/method/url/ip + status only), never in the frontend bundle |
| Client ID (again) | Vercel project → Settings → Environment Variables → `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the button only renders when the public ID is present (public by design — it is not a secret) |

`backend/.env` is gitignored (`.env*`), loaded into the api container through
compose `env_file`. The committed template `backend/.env.example` carries
empty placeholders only.

## 3. Activate

1. Fill the two lines in `backend/.env` on the box.
2. `docker compose up -d --force-recreate api` (env changes need a recreate).
3. Vercel: add `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, then redeploy — `NEXT_PUBLIC_*`
   is baked at build time.
4. Verify:
   ```bash
   curl -s https://api.sckoll.com/v1/auth/config
   # → {"google_enabled":true,...}
   ```
   and https://www.sckoll.com/sign-in shows the Google button; a real sign-in
   lands a session (account auto-created/linked, verified email flows
   auto-link — unverified provider emails are refused by design).

## 4. Handing values over without leaking them

Set the two lines on the box directly (safest), or paste them in the ops
chat — they are written only into the host-local `backend/.env` and never
into git, commits, issues, CI logs, or the frontend. Never put the **secret**
in a `NEXT_PUBLIC_*` var or anywhere client-reachable: only the Client ID is
public.

## 5. Rotation

New client in the console → update the two lines in `backend/.env` →
`docker compose up -d --force-recreate api` → verify `/v1/auth/config` and one
real sign-in. Sessions are unaffected (they are signed by `AUTH_SECRET`, not
Google). See `docs/runbooks/rotate-secrets.md`.
