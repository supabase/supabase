#!/bin/sh
#
# Studio CSRF protection: the API gateway rejects cross-origin requests that
# aren't GET, HEAD or OPTIONS on Studio routes. It uses Sec-Fetch-Site, then
# falls back to Origin (https://words.filippo.io/csrf/). Non-browser requests,
# which send neither header, and API routes are not affected.
#
# Usage (from the docker/ directory of a running local stack):
#   sh tests/test-studio-csrf.sh              # Uses http://localhost:8000
#   sh tests/test-studio-csrf.sh <base_url>   # Custom URL
#

set -eu

BASE_URL="${1:-http://localhost:8000}"
# Origin of BASE_URL (scheme://host[:port]), what a same-origin browser sends
SAME_ORIGIN=$(printf '%s' "$BASE_URL" | sed -E 's|^([a-zA-Z][a-zA-Z0-9+.-]*://[^/]+).*|\1|')
OTHER_ORIGIN=https://evil.example.com
# Studio returns 404 for this path. Requests the gateway lets through never
# reach anything that changes state.
STUDIO_URL="$BASE_URL/api/csrf-test"

if [ ! -f .env ]; then
    echo "Error: run from the docker/ directory of the running stack."
    exit 1
fi

# Values already in the environment take precedence over .env
DASHBOARD_USERNAME="${DASHBOARD_USERNAME:-$(grep '^DASHBOARD_USERNAME=' .env | cut -d= -f2-)}"
DASHBOARD_PASSWORD="${DASHBOARD_PASSWORD:-$(grep '^DASHBOARD_PASSWORD=' .env | cut -d= -f2-)}"
ANON_KEY="${ANON_KEY:-$(grep '^ANON_KEY=' .env | cut -d= -f2-)}"

body=""
trap 'rm -f "$body"' EXIT
body=$(mktemp)

pass=0
fail=0

# check <description> blocked|allowed <status>
# Blocked means the gateway's own 403, not a 403 from the upstream.
check() {
    if [ "$3" = "000" ] || [ -z "$3" ]; then
        result=unreachable
    elif grep -q 'cross-origin request blocked' "$body" 2>/dev/null; then
        result=blocked
    else
        result=allowed
    fi
    if [ "$result" = "$2" ]; then
        echo "  PASS: $1 ($3)"
        pass=$((pass + 1))
    else
        echo "  FAIL: $1 (expected $2, got $result with status $3)"
        fail=$((fail + 1))
    fi
}

# studio <method> [curl header args...]
studio() {
    method=$1
    shift
    : > "$body"
    curl -s --max-time 30 -o "$body" -w '%{http_code}' -X "$method" "$STUDIO_URL" \
        -u "$DASHBOARD_USERNAME:$DASHBOARD_PASSWORD" \
        -H 'Content-Type: application/json' \
        "$@" || true
}

echo "--- Studio: Sec-Fetch-Site ---"
status=$(studio POST -H 'Sec-Fetch-Site: cross-site' -H "Origin: $OTHER_ORIGIN")
check "POST cross-site is blocked" blocked "$status"
status=$(studio POST -H 'Sec-Fetch-Site: same-site' -H "Origin: $OTHER_ORIGIN")
check "POST same-site is blocked" blocked "$status"
status=$(studio POST -H 'Sec-Fetch-Site: same-origin' -H "Origin: $SAME_ORIGIN")
check "POST same-origin is allowed" allowed "$status"
status=$(studio POST -H 'Sec-Fetch-Site: none')
check "POST user-initiated (none) is allowed" allowed "$status"
status=$(studio DELETE -H 'Sec-Fetch-Site: cross-site')
check "DELETE cross-site is blocked" blocked "$status"
status=$(studio GET -H 'Sec-Fetch-Site: cross-site' -H "Origin: $OTHER_ORIGIN")
check "GET cross-site is allowed" allowed "$status"

echo "--- Studio: Origin fallback (no Sec-Fetch-Site) ---"
status=$(studio POST -H "Origin: $OTHER_ORIGIN")
check "POST from other origin is blocked" blocked "$status"
status=$(studio POST -H 'Origin: null')
check "POST from opaque origin (null) is blocked" blocked "$status"
status=$(studio POST -H "Origin: $SAME_ORIGIN")
check "POST from same origin is allowed" allowed "$status"
status=$(studio POST)
check "POST without Origin (non-browser) is allowed" allowed "$status"

echo "--- API routes are not affected ---"
: > "$body"
status=$(curl -s --max-time 30 -o "$body" -w '%{http_code}' -X POST "$BASE_URL/rest/v1/" \
    -H "apikey: $ANON_KEY" \
    -H 'Sec-Fetch-Site: cross-site' \
    -H "Origin: $OTHER_ORIGIN") || true
check "REST POST cross-site is allowed" allowed "$status"

echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
