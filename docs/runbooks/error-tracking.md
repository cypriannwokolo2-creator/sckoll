# Runbook — error tracking (self-hosted GlitchTip)

Sentry-compatible error tracking, self-hosted on this box (no third-party
account). Two compose services, ~180 MB total:

| service            | image                       | role                                    |
| ------------------ | --------------------------- | --------------------------------------- |
| `glitchtip`        | `glitchtip/glitchtip:6.2.6` | UI/API + embedded task worker + scheduler |
| `glitchtip-valkey` | `valkey/valkey:8-alpine`    | task queue/cache                        |

- **Host-local only**: bound to `127.0.0.1:8120` — deliberately not on the
  public Traefik router (error data is sensitive). Reach the UI with an SSH
  tunnel: `ssh -L 8120:127.0.0.1:8120 <box>` → http://localhost:8120
- **Config**: `.env.glitchtip` at the repo root (gitignored) — `SECRET_KEY`,
  `APP_URL`, `GLITCHTIP_OPS_PASSWORD` (ops login), plus
  `GLITCHTIP_EMBED_WORKER=true` (**required in v6.2**: without it the task
  worker never starts and every event sits unconsumed in the queue)
- **DB**: `glitchtip` database in the sckoll postgres container (created
  once via `CREATE DATABASE glitchtip`); migrations run on every container
  start (compose `command`), safe under concurrent replicas (advisory lock)

## Projects, users, tokens (created at provisioning)

- org `Sckoll`; projects `sckoll-backend` (id 1), `sckoll-frontend` (id 2)
- ops user `ops@sckoll.local` (password in `.env.glitchtip`)
- API token `ci-sourcemaps` (scopes: `project:read,project:write,project:releases,org:read`;
  value in `backend/.env` as `SENTRY_AUTH_TOKEN`) — used for source-map uploads

## Backend (live)

`backend/.env`:

- `SENTRY_DSN` — internal-network DSN (⚠️ Sentry protocol requires the public
  key **without hyphens**, even though GlitchTip stores it as a UUID)
- `SENTRY_RELEASE` — must equal the release uploaded via
  `scripts/sentry-release.sh`, e.g. `sckoll-api@<git sha>`
- `SENTRY_AUTH_TOKEN` — for the upload script

Wiring: `backend/src/lib/observability.ts` (init + capture, DSN-driven no-op),
error handler in `backend/src/index.ts` (reports first, then replies with the
unchanged Fastify `{ statusCode, error, message }` contract). Tests never send
events (`test-setup.ts` deletes `SENTRY_DSN`).

### After every API deploy

```bash
# 1. point the backend at the new release
sed -i "s|^SENTRY_RELEASE=.*|SENTRY_RELEASE=sckoll-api@$(git rev-parse HEAD)|" backend/.env
docker compose up -d api
# 2. upload that release's source maps (dist is read from the running container)
./scripts/sentry-release.sh
```

## Frontend (wired, dormant)

`sentry.client/server/edge.config.ts` + `instrumentation.ts` (Next's native
hook — works with the Turbopack build, no webpack wrapper). No-op until a DSN
exists. To activate:

1. Add DNS: `glitchtip.sckoll.com` → box IP
2. In `docker-compose.yml` (glitchtip service): switch to the `edge` network
   and add the standard Traefik labels (see the `api` service pattern); set
   `APP_URL=https://glitchtip.sckoll.com` in `.env.glitchtip`
3. Vercel env: `NEXT_PUBLIC_SENTRY_DSN` (frontend project DSN — take it from
   the GlitchTip UI, hyphens stripped from the key) and optionally
   `SENTRY_DSN` for server bundles
4. Frontend source maps: `SENTRY_AUTH_TOKEN` + `SENTRY_URL` +
   `SENTRY_ORG=sckoll SENTRY_PROJECT=sckoll-frontend npx sentry-cli sourcemaps inject .next && npx sentry-cli sourcemaps upload --release $VERCEL_GIT_COMMIT_SHA --url-prefix '~/' .next`
   (add to the Vercel build or CI once the URL is public)

## Gotchas (learned the hard way)

- `GLITCHTIP_EMBED_WORKER=true` — v6.2 gates the embedded worker on this env
  var; events otherwise queue forever with a healthy-looking container
- DSN public keys: hyphens **removed** (`801c66bd986a…`), or the SDK says
  `Invalid Sentry Dsn`
- `APP_URL` must be a URL the uploader can resolve — chunked source-map
  upload follows absolute URLs built from it
- API token scopes are a bitfield int (flags in `APIToken` field `scopes`);
  a token with scope `0` gets `403 Permission denied` on upload
