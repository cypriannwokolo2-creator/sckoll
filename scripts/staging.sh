#!/usr/bin/env bash
# Staging stack control (separate compose project, never touches prod data).
#
#   ./scripts/staging.sh up       build, migrate (image CMD), wait, seed
#   ./scripts/staging.sh status   container states + readiness
#   ./scripts/staging.sh logs     follow api logs
#   ./scripts/staging.sh seed     re-run the idempotent seed (host-side)
#   ./scripts/staging.sh down     stop + remove containers (volume kept)
#   ./scripts/staging.sh destroy  stop AND delete the staging database volume
set -euo pipefail
cd "$(dirname "$0")/.."

# Compose interpolation and the seed both read these (root .env is gitignored).
set -a; [ -f .env ] && . ./.env; set +a

PROJECT=sckoll-staging
FILE=docker-compose.staging.yml
compose() { docker compose -p "$PROJECT" -f "$FILE" "$@"; }
STAGING_URL="http://127.0.0.1:8111"

seed() {
  # Host-side seed against the staging DB only: dotenv loads backend/.env but
  # an explicitly exported DATABASE_URL wins over it (dotenv never overrides).
  DATABASE_URL="postgres://sckoll:${POSTGRES_PASSWORD}@127.0.0.1:5436/sckoll_staging" \
    AUTH_SECRET="${STAGING_AUTH_SECRET}" \
    npm --prefix backend run db:seed --silent
}

case "${1:-status}" in
  up)
    compose up -d --build
    for _ in $(seq 1 30); do
      code=$(curl -s -o /dev/null -w '%{http_code}' "$STAGING_URL/readyz" || true)
      [ "$code" = "200" ] && break
      sleep 4
    done
    echo "staging readyz=$code"
    seed
    echo "staging up → $STAGING_URL (SSH tunnel to reach from outside)"
    ;;
  status)
    compose ps
    curl -s -o /dev/null -w 'readyz=%{http_code}\n' "$STAGING_URL/readyz" || true
    ;;
  logs) compose logs -f api ;;
  seed) seed ;;
  down) compose down ;;
  destroy) compose down -v ;;
  *) echo "usage: $0 {up|status|logs|seed|down|destroy}"; exit 1 ;;
esac
