#!/usr/bin/env bash
# 5-minute sentinel: checks the public surface and the API error rate, and
# emails an alert (Brevo) on failure or spike — plus a recovery mail.
#
#   ALERT_AFTER      consecutive bad rounds before alerting   (default 2 = ~10 min)
#   ERROR_THRESHOLD  level:50 log lines in the window         (default 20)
#   SENTINEL_TEST=1  pretend a probe failed (validates the alert channel)
#
# Config comes from backend/.env (gitignored): BREVO_API_KEY, BREVO_FROM_SECURITY,
# optional ALERT_TO (defaults to the repo owner address).
#
# Limitation: this runs ON the box, so it cannot see whole-box downtime.
# An off-box monitor (Better Stack / UptimeRobot) is the second layer.
set -uo pipefail   # deliberately no -e: a failing probe must not abort the run

cd "$(dirname "$0")/.."
STATE_DIR="${STATE_DIR:-$PWD/.sentinel}"
mkdir -p "$STATE_DIR"
STATE_FILE="$STATE_DIR/state"
ALERT_AFTER="${ALERT_AFTER:-2}"
ERROR_THRESHOLD="${ERROR_THRESHOLD:-20}"

envval() { grep -E "^$1=" backend/.env 2>/dev/null | head -1 | cut -d= -f2-; }
BREVO_API_KEY="$(envval BREVO_API_KEY)"
SENDER="$(envval BREVO_FROM_SECURITY | sed -E 's/.*<([^>]+)>.*/\1/')"
ALERT_TO="${ALERT_TO:-$(envval ALERT_TO)}"
ALERT_TO="${ALERT_TO:-lindawheek@gmail.com}"

probe() { # prints "OK" or "FAIL(http)"
  local url="$1" code
  code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$url" 2>/dev/null) || code=000
  [ "$code" = "200" ] && echo "OK" || echo "FAIL($code)"
}

REASONS=()
W_WWW=$(probe "https://www.sckoll.com/")
W_API=$(probe "https://api.sckoll.com/healthz")
W_RDY=$(probe "https://api.sckoll.com/readyz")
[ "$W_WWW" = "OK" ] || REASONS+=("www.sckoll.com -> $W_WWW")
[ "$W_API" = "OK" ] || REASONS+=("api /healthz -> $W_API")
[ "$W_RDY" = "OK" ] || REASONS+=("api /readyz -> $W_RDY (dependencies)")

ERRS=$(docker compose logs --since 7m api 2>/dev/null | grep -c '"level":50' || true)
if [ "${ERRS:-0}" -gt "$ERROR_THRESHOLD" ]; then
  REASONS+=("error spike: ${ERRS} error-level log lines in 7m (threshold ${ERROR_THRESHOLD})")
fi

[ "${SENTINEL_TEST:-0}" = "1" ] && REASONS+=("SENTINEL TEST — channel validation, no real incident")

BAD=0; [ "${#REASONS[@]}" -gt 0 ] && BAD=1
BAD_ROUNDS=$(grep '^bad_rounds=' "$STATE_FILE" 2>/dev/null | cut -d= -f2)
ALERTED=$(grep '^alerted=' "$STATE_FILE" 2>/dev/null | cut -d= -f2)
BAD_ROUNDS="${BAD_ROUNDS:-0}"; ALERTED="${ALERTED:-0}"

send_mail() { # subject body
  [ -n "$BREVO_API_KEY" ] || { echo "[sentinel] WARN: no BREVO_API_KEY — cannot email"; return 1; }
  local payload resp
  payload=$(python3 - "$1" "$2" "$SENDER" "$ALERT_TO" <<'PY'
import json, sys
subject, body, sender, to = sys.argv[1:5]
print(json.dumps({"sender": {"email": sender, "name": "Sckoll Sentinel"},
                  "to": [{"email": to}], "subject": subject, "textContent": body}))
PY
)
  resp=$(curl -s -X POST https://api.brevo.com/v3/smtp/email \
    -H "api-key: $BREVO_API_KEY" -H "content-type: application/json" -d "$payload")
  echo "$resp" | grep -q '"messageId"' && return 0
  echo "[sentinel] WARN: send failed: $resp" >&2
  return 1
}

if [ "$BAD" = "1" ]; then
  BAD_ROUNDS=$((BAD_ROUNDS + 1))
  if [ "$BAD_ROUNDS" -ge "$ALERT_AFTER" ] && [ "$ALERTED" = "0" ]; then
    BODY="Sckoll is degraded (checked $(date -u +%FT%TZ)):

$(printf '  - %s\n' "${REASONS[@]}")

Checks this round: www=$W_WWW  api.healthz=$W_API  api.readyz=$W_RDY  errors/7m=${ERRS:-0}

Triage: docs/runbooks/restart.md  ·  https://www.sckoll.com/status"
    send_mail "ALERT: sckoll degraded — ${#REASONS[@]} check(s) failing" "$BODY" \
      && { ALERTED=1; echo "[sentinel] ALERT sent"; }
    echo "[sentinel] BAD round $BAD_ROUNDS: ${REASONS[*]}"
  else
    echo "[sentinel] bad round $BAD_ROUNDS (not alerting yet): ${REASONS[*]}"
  fi
else
  if [ "$ALERTED" = "1" ]; then
    send_mail "RESOLVED: sckoll healthy again" \
      "All sentinel checks passed again at $(date -u +%FT%TZ).
Last window had: error-level lines/7m = ${ERRS:-0}.

https://www.sckoll.com/status" && echo "[sentinel] recovery mail sent"
  fi
  BAD_ROUNDS=0; ALERTED=0
  echo "[sentinel] OK (errors/7m=${ERRS:-0})"
fi

printf 'bad_rounds=%s\nalerted=%s\n' "$BAD_ROUNDS" "$ALERTED" > "$STATE_FILE"
