# Runbook — Google sign-in activation

Sckoll uses the **OAuth 2.0 authorization-code flow with PKCE**: the browser is
redirected to Google, Google redirects back to our callback with a one-time
code, and the API exchanges that code for the user's identity **on our
server** (`backend/src/lib/google-client.ts`). The client secret never leaves
the host, and the ID token is verified against Google's public keys for
signature, audience and issuer.

Why this replaced the old popup (ID-token) flow: the popup needed the
browser's *origin* registered in the console and broke in ways that surfaced
as a dead button (origin_mismatch, popup blockers, FedCM). The redirect flow
needs a registered *redirect URI* only, and every failure is a real HTTP
response we control.

## 1. Google Cloud Console → Credentials → OAuth client ID (Web application)

| Console field | Value |
|---|---|
| Authorized redirect URIs | `https://api.sckoll.com/v1/auth/google/callback` (+ `http://127.0.0.1:8110/v1/auth/google/callback` for local dev) |
| Authorized JavaScript origins | **not used by this flow** — the browser never calls Google directly, so it can be left empty |

The redirect URI must match **exactly** — scheme, host, path, no trailing
slash. A mismatch is Google's `redirect_uri_mismatch` error, shown on the
consent screen.

Copy the **Client ID** (ends with `.apps.googleusercontent.com`) and the
**Client secret** (`GOCSPX-…`).

## 2. Where each value goes (never in git)

| Value | Where | Why |
|---|---|---|
| Client ID | box `backend/.env` → `GOOGLE_CLIENT_ID=` | the API identifies itself to Google; `/v1/auth/config` flips `google_enabled` |
| Client secret | box `backend/.env` → `GOOGLE_CLIENT_SECRET=` | server-only: the code exchange is a confidential-client call. Never returned by any route, never logged (logger serializers emit id/method/url/ip + status only), never in the frontend bundle |
| Redirect URI | box `backend/.env` → `GOOGLE_REDIRECT_URI=` | must equal the console's Authorized redirect URI exactly |

The frontend needs **no Google configuration at all**: it asks
`/v1/auth/config` whether Google is enabled and links to
`/v1/auth/google`, which redirects to Google. There is no `NEXT_PUBLIC_*`
Google variable any more — the old one was the reason a production build
could silently lose the button.

`backend/.env` is gitignored (`.env*`), loaded into the api container through
compose `env_file`. The committed template `backend/.env.example` carries
empty placeholders only.

## 3. Activate

1. Fill the three lines in `backend/.env` on the box.
2. `docker compose up -d --force-recreate api` (env changes need a recreate).
3. Verify the server is ready:
   ```bash
   curl -s https://api.sckoll.com/v1/auth/config
   # → {"google_enabled":true,"email_password_enabled":true}
   ```
   `google_enabled` is true only when the client id, the secret **and** the
   redirect URI are all present — a half-configured client reports disabled
   rather than failing mid-flow.
4. Verify the redirect works end to end:
   ```bash
   curl -si "https://api.sckoll.com/v1/auth/google" | head -5
   # → HTTP/2 302, Location: https://accounts.google.com/o/oauth2/v2/auth?...
   ```
   A 503 here means the server is not configured; a 302 to Google with no
   `client_id` in the URL means the console client is wrong.
5. In a browser: https://www.sckoll.com/sign-in shows "Continue with Google";
   a real sign-in lands a session (account auto-created/linked, verified
   email flows auto-link — unverified provider emails are refused by design).

## 4. Handing values over without leaking them

Set the three lines on the box directly (safest), or use the silent prompt
helper `bash /root/set-google-env.sh` — it reads the secret without echoing
it and writes only into the host-local `backend/.env`. Never put the **secret**
in a `NEXT_PUBLIC_*` var or anywhere client-reachable.

## 5. Rotation

New client in the console (with the redirect URI listed) → update the three
lines in `backend/.env` → `docker compose up -d --force-recreate api` →
verify `/v1/auth/config` and one real sign-in. Sessions are unaffected (they
are signed by `AUTH_SECRET`, not Google). See
`docs/runbooks/rotate-secrets.md`.

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `google_enabled:false` | one of the three env values is missing | check `backend/.env` and recreate the container |
| 503 from `/v1/auth/google` | Google not configured server-side | same as above |
| Google's "redirect_uri_mismatch" | the console's Authorized redirect URI differs from `GOOGLE_REDIRECT_URI` | make them byte-identical |
| Google shows "origin not allowed" | a leftover JS-origin flow is still being used somewhere | the current flow never calls Google from the browser; check for a stale deploy |
| Button missing on /sign-in | the API reported `google_enabled:false`, or the frontend could not reach the API | check the network tab for `/v1/auth/config` |
| User lands back on /sign-in?error=… | the flow failed | the `error` code maps to a message: `google_cancelled`, `google_failed`, `google_state` (expired/tampered), `google_unverified` (provider email not verified), `google_disabled` |
