# Runbook — monitoring & alerting

Two mechanisms, both on the box, both driven by `scripts/` + cron:

## Sentinel (uptime + error-rate)

`scripts/sentinel.sh` runs **every 5 minutes** (cron, log: `/var/log/sckoll-sentinel.log`):

- `https://www.sckoll.com/` → 200
- `https://api.sckoll.com/healthz` → 200 (process)
- `https://api.sckoll.com/readyz` → 200 (dependencies — db/redis)
- error spike: more than `ERROR_THRESHOLD` (default 20) `level:50` API log lines in 7 minutes

State (`.sentinel/state`, gitignored) stops the mails from becoming noise:

- Alert email only after `ALERT_AFTER` (default 2 = ~10 min) consecutive bad rounds, then **one**
  alert per incident.
- A **recovery mail** is sent when checks pass again after an alert.
- `SENTINEL_TEST=1 ./scripts/sentinel.sh` forces a fake failure to validate the channel.

### Alert channel (Brevo email)

Uses `BREVO_API_KEY` + `BREVO_FROM_SECURITY` from `backend/.env`; recipient is `ALERT_TO`
in the same file (defaults to the repo owner address if unset).

**Current gap:** `BREVO_API_KEY` is empty on the serving box, so the sentinel detects and
logs but cannot email. Set the key (see [rotate-secrets.md](./rotate-secrets.md)) and run
`SENTINEL_TEST=1 ALERT_AFTER=1 ./scripts/sentinel.sh` — the owner should receive exactly one
test alert. Until then failures are visible only in the sentinel log and on `/status`.

### Known limitation

The sentinel runs **on the box**, so it cannot see whole-box or network downtime. The second
layer is an off-box monitor (Better Stack / UptimeRobot free tier, 5-min interval, pointing at
`/status` or `/healthz`) — when one is provisioned, add its webhook to this runbook.

## Nightly backups

`scripts/backup.sh` — see [restore.md](./restore.md). Loud warning while `RCLONE_REMOTE` is unset;
a restore drill has been executed successfully (2026-10-17).

## Error tracking

Structured logs are the current source of truth (`docker compose logs api`), including
`x-request-id` correlation with what a user's browser reported. GlitchTip/Sentry is the next
addition (Phase 11).
