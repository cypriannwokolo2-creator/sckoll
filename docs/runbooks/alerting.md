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

**Status (2026-10-20): live.** The key is set on the serving box (entered via a host-local
silent prompt — never in chat, git, or logs) and a real test send was accepted by Brevo
(`messageId` returned → `ALERT_TO`), so the sentinel now emails alerts and recovery mails.
The account accepts sends for `sckoll.com` without DNS verification; SPF/DKIM alignment is
an optional deliverability follow-up, not a requirement. Re-validate at any time with
`SENTINEL_TEST=1 ALERT_AFTER=1 ./scripts/sentinel.sh` — exactly one test alert arrives.

### Known limitation

The sentinel runs **on the box**, so it cannot see whole-box or network downtime. The second
layer is an off-box monitor (Better Stack / UptimeRobot free tier, 5-min interval, pointing at
`/status` or `/healthz`) — when one is provisioned, add its webhook to this runbook.

## Nightly backups

`scripts/backup.sh` — see [restore.md](./restore.md). Loud warning while `RCLONE_REMOTE` is unset;
a restore drill has been executed successfully (2026-10-17).

## Error tracking

Self-hosted GlitchTip is live — see [error-tracking.md](./error-tracking.md). Structured
logs (`docker compose logs api`, `x-request-id` correlation) remain the second source of truth.
