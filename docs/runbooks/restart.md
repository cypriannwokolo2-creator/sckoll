# Runbook — restart the stack

When: deploy looks wedged, `/readyz` stays `degraded`, or a container is crash-looping.

All commands run on the host box, from the repo checkout (`/root/sckoll` by default).

## 1. See what is actually wrong

```bash
docker compose ps                      # healthy / restarting / exited
docker compose logs --tail 100 api     # app logs (structured JSON)
curl -s http://127.0.0.1:8110/readyz | jq .   # dependency-level detail
```

`/readyz` separates "the process is dead" (liveness, `/healthz`) from "the process is up but
cannot reach Postgres/Redis" (readiness). Restarting does not fix the second case — fix the
dependency instead (see below).

## 2. Restart one service vs. the whole stack

```bash
docker compose restart api             # fastest, keeps the container
docker compose up -d --force-recreate api   # if the container itself is corrupt
docker compose down && docker compose up -d # last resort: full stack restart
```

`docker compose down` stops Postgres too — the API will restart, then report `degraded` until
the DB is back. That is expected; do not "fix" it by removing the healthcheck.

## 3. If the database is the problem

```bash
docker compose logs --tail 50 db
docker compose exec db pg_isready -U sckoll
docker compose exec db psql -U sckoll -d sckoll -c 'select count(*) from users;'
```

Corrupt/partial migrations after a bad deploy → roll back (see [rollback.md](./rollback.md));
migrations are applied **before** the server starts, so the container exit code tells you
whether the failure was the migration or the app.

## 4. Verify recovery

```bash
curl -s http://127.0.0.1:8110/readyz | jq .status   # expect "ready"
docker compose ps                                    # api: healthy (healthcheck = /readyz)
```

Then confirm the public path: `https://www.sckoll.com/status` renders all checks green.
