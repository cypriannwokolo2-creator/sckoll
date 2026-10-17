# Runbook — backup & restore drill

A backup that has never been restored is a guess. This is the procedure; run the drill
whenever the backup mechanism changes and at least quarterly.

## What runs nightly

`scripts/backup.sh` (cron on the host box, see below):

- `pg_dump` of `sckoll` **inside the db container** (version-matched), gzipped into
  `<repo>/backups/`, integrity-checked (`gzip -t` + minimum size).
- 14-day retention locally.
- `rclone sync` to `RCLONE_REMOTE` when configured — off-box is the point: local-only
  backups do not survive losing the host. The script logs a loud warning while the remote
  is unset.

```bash
# crontab -e on the host box (03:17 UTC, off the hourly boundaries)
17 3 * * * cd /root/sckoll && RCLONE_REMOTE="r2:sckoll-backups" ./scripts/backup.sh >> /var/log/sckoll-backup.log 2>&1
```

## Restore drill (scripted)

```bash
# 1. Take the newest dump and restore it into a scratch database — never `sckoll`
LATEST=$(ls -1t backups/sckoll-*.sql.gz | head -1)
scripts/restore.sh "$LATEST" sckoll_restore_drill --force

# 2. The script prints user/opportunity/payment counts — compare them against
#    production the same way; they should be in the same ballpark:
docker compose exec db psql -U sckoll -d sckoll -Atc 'select count(*) from users;'

# 3. Point a scratch API at the restored DB and smoke it (optional but ideal):
#    DATABASE_URL=postgres://sckoll:sckoll@db:5432/sckoll_restore_drill PORT=8111 node dist/index.js
#    curl -s http://127.0.0.1:8111/readyz

# 4. Clean up
docker compose exec db psql -U sckoll -d postgres -c 'DROP DATABASE sckoll_restore_drill;'
```

`restore.sh` **refuses** to target the production `sckoll` database — cutting production over
to a restored dump is a deliberate migration (stop API, restore into a renamed database,
verify, swap), not a one-liner.

## What the drill proves

- Dumps are complete and loadable (schema + data), not truncated garbage.
- The schema at backup-time matches what a restored API expects (backward-compatible
  migrations policy — see [rollback.md](./rollback.md)).
- Someone who is not the person who wrote the backup can execute the restore from this doc.

Record the date and result of each drill in the commit that changes the backup setup, or in
the ops log — "it worked in <month>" is what future-you needs to see.
