#!/usr/bin/env bash
# Restore a backup into a database. Requires an explicit target + --force.
#
#   Usage: scripts/restore.sh <dump.sql.gz> <database-name> --force
#
# Never point this at `sckoll` (production) during a drill — use a scratch
# database such as `sckoll_restore_drill` and verify, then drop it.
set -euo pipefail

cd "$(dirname "$0")/.."

DUMP="${1:-}"
TARGET_DB="${2:-}"
FORCE="${3:-}"

if [ -z "$DUMP" ] || [ -z "$TARGET_DB" ] || [ "$FORCE" != "--force" ]; then
  echo "usage: scripts/restore.sh <dump.sql.gz> <database-name> --force" >&2
  exit 64
fi
[ -f "$DUMP" ] || { echo "[restore] no such file: $DUMP" >&2; exit 66; }
gzip -t "$DUMP"

if [ "$TARGET_DB" = "sckoll" ]; then
  echo "[restore] REFUSING to restore over production 'sckoll'." >&2
  echo "[restore] Restore into a scratch DB, verify, then cut over deliberately." >&2
  exit 65
fi

echo "[restore] (re)creating database $TARGET_DB"
docker compose exec -T db psql -U sckoll -d postgres -c "DROP DATABASE IF EXISTS \"$TARGET_DB\";"
docker compose exec -T db psql -U sckoll -d postgres -c "CREATE DATABASE \"$TARGET_DB\";"

echo "[restore] loading $DUMP into $TARGET_DB (this takes a while)"
gzip -dc "$DUMP" | docker compose exec -T db psql -U sckoll -d "$TARGET_DB" -q

echo "[restore] sanity counts:"
docker compose exec -T db psql -U sckoll -d "$TARGET_DB" -Atc \
  "select 'users=' || count(*) from users union all select 'opportunities=' || count(*) from opportunities union all select 'payments=' || count(*) from payments;"
echo "[restore] OK: $TARGET_DB restored. Drop it when done: docker compose exec db psql -U sckoll -d postgres -c 'DROP DATABASE \"$TARGET_DB\";'"
