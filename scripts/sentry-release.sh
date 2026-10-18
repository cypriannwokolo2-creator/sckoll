#!/usr/bin/env bash
# Upload backend source maps to GlitchTip for a release, so stack traces in
# error events show TS source instead of minified/dist paths.
#
#   ./scripts/sentry-release.sh [release]   # default: sckoll-api@<git sha>
#
# Config (from backend/.env): SENTRY_DSN host + the ops API token created in
# GlitchTip (label: ci-sourcemaps). SENTRY_ORG/SENTRY_PROJECT default to the
# self-hosted instance's org/project names.
#
# Run after every API deploy: the release in backend/.env (SENTRY_RELEASE)
# MUST equal the release uploaded here, or events won't match the maps.
set -euo pipefail
cd "$(dirname "$0")/.."

RELEASE="${1:-sckoll-api@$(git rev-parse HEAD)}"
SENTRY_URL="${SENTRY_URL:-http://127.0.0.1:8120}"
SENTRY_ORG="${SENTRY_ORG:-sckoll}"
SENTRY_PROJECT="${SENTRY_PROJECT:-sckoll-backend}"
TOKEN="${SENTRY_AUTH_TOKEN:-$(grep -E '^SENTRY_AUTH_TOKEN=' backend/.env 2>/dev/null | cut -d= -f2-)}"
[ -n "$TOKEN" ] || { echo "No SENTRY_AUTH_TOKEN (backend/.env or env)"; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# dist comes from the running container — it is the exact build in production.
docker compose exec -T api tar -C /app -cf - dist > "$WORK/dist.tar"
tar -C "$WORK" -xf "$WORK/dist.tar"

export SENTRY_URL SENTRY_ORG SENTRY_PROJECT SENTRY_AUTH_TOKEN="$TOKEN"
npx --yes @sentry/cli@latest sourcemaps upload \
  --release "$RELEASE" \
  --url-prefix "~/app/dist" \
  "$WORK/dist"

echo "Uploaded source maps for release $RELEASE → $SENTRY_ORG/$SENTRY_PROJECT"
