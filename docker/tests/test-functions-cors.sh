#!/bin/sh
#
# Edge Functions CORS: the API gateway leaves CORS on /functions/v1 to the
# function, as on the platform. Deploys a temporary function that allows one
# origin, and checks that its CORS answer reaches the client unchanged.
#
# Usage (from the docker/ directory of a running local stack):
#   sh tests/test-functions-cors.sh              # Uses http://localhost:8000
#   sh tests/test-functions-cors.sh <base_url>   # Custom URL
#

set -eu

BASE_URL="${1:-http://localhost:8000}"
ALLOWED_ORIGIN=https://app.example.com
OTHER_ORIGIN=https://other.example.com

if [ ! -f .env ] || [ ! -d volumes/functions ]; then
    echo "Error: run from the docker/ directory of the running stack."
    exit 1
fi

SUPABASE_PUBLISHABLE_KEY=$(grep '^SUPABASE_PUBLISHABLE_KEY=' .env | cut -d= -f2-)

fn_dir=""
headers=""
trap 'rm -rf "$fn_dir" "$headers"' EXIT
fn_dir=$(mktemp -d volumes/functions/cors-test-XXXXXX)
headers=$(mktemp)
fn_url="$BASE_URL/functions/v1/${fn_dir##*/}"

# Allows one origin. Sends Allow-Credentials on every response, as many
# functions do, so a gateway that adds its own Allow-Origin would expose
# credentialed responses to other origins.
cat > "$fn_dir/index.ts" <<'EOF'
const allowedOrigin = 'https://app.example.com'

Deno.serve((req) => {
  const allowed = req.headers.get('Origin') === allowedOrigin
  const headers = new Headers({ 'Access-Control-Allow-Credentials': 'true', Vary: 'Origin' })
  if (allowed) headers.set('Access-Control-Allow-Origin', allowedOrigin)
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: allowed ? 204 : 403, headers })
  }
  return new Response('ok', { headers })
})
EOF
# The runtime container may run as a different user.
chmod 755 "$fn_dir"
chmod 644 "$fn_dir/index.ts"

pass=0
fail=0

check() {
    if [ "$3" = "$2" ]; then
        echo "  PASS: $1"
        pass=$((pass + 1))
    else
        echo "  FAIL: $1 (expected '$2', got '$3')"
        fail=$((fail + 1))
    fi
}

allow_origin() {
    awk 'tolower($1) == "access-control-allow-origin:" { sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]*$/, ""); print }' "$headers"
}

# preflight <origin>: what a browser sends before a POST with a JSON body
preflight() {
    : > "$headers"
    curl -s --max-time 30 -o /dev/null -D "$headers" -w '%{http_code}' -X OPTIONS "$fn_url" \
        -H "Origin: $1" \
        -H 'Access-Control-Request-Method: POST' \
        -H 'Access-Control-Request-Headers: authorization, content-type'
}

# post <origin> [apikey]: defaults to the publishable key
post() {
    : > "$headers"
    curl -s --max-time 30 -o /dev/null -D "$headers" -w '%{http_code}' -X POST "$fn_url" \
        -H "Origin: $1" \
        -H "apikey: ${2:-$SUPABASE_PUBLISHABLE_KEY}" \
        -d 'x'
}

echo "--- Edge Functions CORS ---"
check "Preflight from other origin returns the function's 403" "403" "$(preflight "$OTHER_ORIGIN")"
check "Preflight from other origin has no Allow-Origin" "" "$(allow_origin)"
check "Preflight from allowed origin returns the function's 204" "204" "$(preflight "$ALLOWED_ORIGIN")"
check "Preflight from allowed origin keeps the function's Allow-Origin" "$ALLOWED_ORIGIN" "$(allow_origin)"
check "POST from other origin succeeds" "200" "$(post "$OTHER_ORIGIN")"
check "POST from other origin has no Allow-Origin" "" "$(allow_origin)"
check "POST from allowed origin succeeds" "200" "$(post "$ALLOWED_ORIGIN")"
check "POST from allowed origin keeps the function's Allow-Origin" "$ALLOWED_ORIGIN" "$(allow_origin)"

# Envoy rejects an unknown sb_ key itself (Kong passes it to the function).
# That error must stay readable by browsers.
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^supabase-envoy$'; then
    check "Unknown sb_ key gets Envoy's 401" "401" \
        "$(post "$OTHER_ORIGIN" sb_publishable_0000000000000000000000_00000000)"
    check "Envoy's 401 allows any origin" "*" "$(allow_origin)"
else
    echo "  SKIP: Envoy 401 checks (Envoy not running)"
fi

# Other routes keep the gateway's CORS policy.
: > "$headers"
rest_status=$(curl -s --max-time 30 -o /dev/null -D "$headers" -w '%{http_code}' \
    -X OPTIONS "$BASE_URL/rest/v1/" \
    -H "Origin: $OTHER_ORIGIN" \
    -H 'Access-Control-Request-Method: GET') || true
check "REST preflight succeeds" "200" "$rest_status"
case "$(allow_origin)" in
    '*' | "$OTHER_ORIGIN") rest_cors=yes ;;
    *) rest_cors=no ;;
esac
check "REST preflight allows the origin (gateway CORS)" "yes" "$rest_cors"

echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
