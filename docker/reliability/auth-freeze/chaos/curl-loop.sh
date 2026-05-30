#!/usr/bin/env bash
# curl-loop.sh
#
# Laptop-friendly reproducer. No k6 install required. Spawns N concurrent
# curl processes calling /token in a tight loop for SECS seconds while
# logging the response code distribution and the cheap-vs-deep healthcheck
# verdict side-by-side every second.
#
# Usage:
#   ./curl-loop.sh 60 50
#                  ^   ^
#                  |   parallel
#                  duration
#
# Required env (same as the rest of the compose stack):
#   BASE_URL        e.g. http://localhost:8000
#   ANON_KEY
#   TEST_EMAIL  TEST_PASSWORD

set -euo pipefail

SECS="${1:-60}"
PARALLEL="${2:-50}"

BASE_URL="${BASE_URL:?BASE_URL required}"
ANON_KEY="${ANON_KEY:?ANON_KEY required}"
TEST_EMAIL="${TEST_EMAIL:?TEST_EMAIL required}"
TEST_PASSWORD="${TEST_PASSWORD:?TEST_PASSWORD required}"
DEEP_URL="${DEEP_URL:-http://localhost:9101/probe}"

PAYLOAD=$(printf '{"email":"%s","password":"%s"}' "$TEST_EMAIL" "$TEST_PASSWORD")
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"; jobs -p | xargs -r kill 2>/dev/null || true' EXIT INT TERM

worker () {
  local id=$1
  local end=$(( $(date +%s) + SECS ))
  local out="$TMPDIR/w$id"
  : > "$out"
  while [ "$(date +%s)" -lt "$end" ]; do
    code=$(curl -s -o /dev/null -w '%{http_code} %{time_total}' \
                --max-time 15 \
                -H "apikey: $ANON_KEY" \
                -H "Authorization: Bearer $ANON_KEY" \
                -H 'Content-Type: application/json' \
                -d "$PAYLOAD" \
                "$BASE_URL/auth/v1/token?grant_type=password")
    echo "$code" >> "$out"
  done
}

reporter () {
  local end=$(( $(date +%s) + SECS ))
  printf '%-8s %-8s %-8s %-8s %-8s %-12s %-12s\n' \
         't+s' 'count' '2xx' '5xx' 'timeout' '/health' '/probe'
  while [ "$(date +%s)" -lt "$end" ]; do
    sleep 1
    cheap=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$BASE_URL/auth/v1/health" || echo 000)
    deep=$(curl -s -o /dev/null -w '%{http_code}'  --max-time 5 "$DEEP_URL"               || echo 000)
    total=$(cat "$TMPDIR"/w* 2>/dev/null | wc -l | tr -d ' ')
    ok=$(awk '/^2/{n++} END{print n+0}'    "$TMPDIR"/w* 2>/dev/null)
    ko=$(awk '/^5/{n++} END{print n+0}'    "$TMPDIR"/w* 2>/dev/null)
    to=$(awk '/^000/{n++} END{print n+0}'  "$TMPDIR"/w* 2>/dev/null)
    elapsed=$(( SECS - (end - $(date +%s)) ))
    printf '%-8s %-8s %-8s %-8s %-8s %-12s %-12s\n' \
           "$elapsed" "$total" "$ok" "$ko" "$to" "$cheap" "$deep"
  done
}

for i in $(seq 1 "$PARALLEL"); do
  worker "$i" &
done
reporter
wait
