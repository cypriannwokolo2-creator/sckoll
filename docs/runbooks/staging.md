# Runbook — staging

A **separate compose project** (`sckoll-staging`, file `docker-compose.staging.yml`)
with its own postgres + redis + api. Isolation from production is structural:

- own volume `sckoll-staging_staging-pgdata` (database `sckoll_staging`) — no
  shared volume or network with the prod project
- **no `env_file`**: prod secrets (`backend/.env`) never enter the stack;
  values come from explicit staging config + `STAGING_AUTH_SECRET` (root `.env`,
  gitignored)
- distinct host ports (db `5436`, redis `6382`, api `8111` — prod uses
  5435/6381/8110); never attached to Traefik, so nothing is publicly routed

```bash
./scripts/staging.sh up       # build → migrate (image CMD) → wait → seed
./scripts/staging.sh status   # containers + readyz probe
./scripts/staging.sh logs     # follow api logs
./scripts/staging.sh seed     # idempotent re-seed (host-side, staging DB only)
./scripts/staging.sh down     # stop (data volume kept)
./scripts/staging.sh destroy  # stop + DELETE the staging database volume
```

Reach the API: `ssh -L 8111:127.0.0.1:8111 <box>` → `http://127.0.0.1:8111`.

## Seed

Self-contained on a fresh database: `db:seed` bootstraps a verified demo client
(`demo-client@sckoll.dev` / `seed-client-password`) when no
`SEED_CLIENT_EMAIL` is given, then seeds 30 opportunities + the demo talent
(`amara@sckoll.dev`). An explicit `SEED_CLIENT_EMAIL` (how prod was seeded, with
`seed@sckoll.com`) always wins; existing databases short-circuit as before.

## Frontend previews (Vercel)

Connected via Git: **every PR gets a Preview deployment** automatically —
verified through GitHub's deployments API:

```bash
gh api repos/<owner>/sckoll/deployments --jq '.[] | .ref + " " + .environment'
# → <pr-sha> | Preview ...   <master-sha> | Production
```

Previews build the frontend against prod API URLs by default; UI-only changes
are safe to review there. Anything needing a staging API goes through the
compose stack above.

## Verify isolation after any staging run

```bash
docker exec sckoll-staging-db-1 psql -U sckoll -d sckoll_staging -Atc \
  "select 'staging users=' || count(*) from users"
docker exec sckoll-db-1 psql -U sckoll -d sckoll -Atc \
  "select 'prod users=' || count(*) from users"   # unchanged
```
