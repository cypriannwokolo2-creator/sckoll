#!/usr/bin/env bash
# Nightly database backup. Idempotent, safe to run any time.
#
#   BACKUP_DIR   where dumps land            (default: <repo>/backups)
#   KEEP_DAYS    retention window            (default: 14)
#   RCLONE_REMOTE optional rclone target, e.g. "r2:sckoll-backups"
#                when set, dumps are synced off-box after a successful dump —
#                local-only backups do not survive losing the host.
#
# Dumps run inside the db container (pg_dump matches the server version).
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-$PWD/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/sckoll-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] dumping sckoll -> $FILE"
docker compose exec -T db pg_dump -U sckoll --no-owner sckoll | gzip -9 > "$FILE"

# A truncated dump must never be kept or shipped.
MIN_BYTES=1024
[ "$(wc -c < "$FILE")" -ge "$MIN_BYTES" ] || { echo "[backup] FAILED: dump too small, removing" >&2; rm -f "$FILE"; exit 1; }
gzip -t "$FILE"

echo "[backup] retention: purging dumps older than ${KEEP_DAYS}d"
find "$BACKUP_DIR" -name 'sckoll-*.sql.gz' -mtime "+$KEEP_DAYS" -delete

if [ -n "${RCLONE_REMOTE:-}" ]; then
  echo "[backup] syncing off-box to $RCLONE_REMOTE"
  rclone copy "$FILE" "$RCLONE_REMOTE" --retries 3
  rclone sync "$BACKUP_DIR" "$RCLONE_REMOTE" --include 'sckoll-*.sql.gz' --retries 3 --max-age "${KEEP_DAYS}d"
else
  echo "[backup] WARN: RCLONE_REMOTE unset — backup is host-local only" >&2
fi

echo "[backup] OK: $(ls -lh "$FILE" | awk '{print $5}')"
