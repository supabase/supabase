#!/bin/sh
# Test function-owned CORS through either the Envoy or Kong gateway.
# Run from docker/ against a local stack with volumes/functions mounted:
#   sh tests/test-functions-cors.sh [http://localhost:8000]
# Requires curl, a configured .env, and the running self-hosted stack.

set -eu

BASE_URL="${1:-http://localhost:8000}"
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2-)
: "${ANON_KEY:?ANON_KEY must be configured in .env}"
headers=$(mktemp)
function_dir=""
cleanup() {
    rm -f "$headers"
    if [ -n "$function_dir" ]; then
        rm -f "$function_dir/index.ts"
        rmdir "$function_dir"
    fi
}
trap cleanup EXIT
function_dir=$(mktemp -d volumes/functions/cors-test-XXXXXX)

cat > "$function_dir/index.ts" <<'EOF'
const allowedOrigin = 'https://app.example.com'

Deno.serve((req) => {
  const allowed = req.headers.get('Origin') === allowedOrigin
  const headers = new Headers({ Vary: 'Origin', 'X-Cors-Handler': 'function' })
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin)
    headers.set('Access-Control-Allow-Methods', 'POST')
    headers.set('Access-Control-Allow-Headers', 'authorization, content-type, x-custom-header')
    headers.set('Access-Control-Allow-Credentials', 'true')
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: allowed ? 204 : 403, headers })
  }
  return new Response('ok', { headers })
})
EOF

# The runtime container may run as a different user from the test runner.
chmod 755 "$function_dir"
chmod 644 "$function_dir/index.ts"

pass=0
fail=0
check() {
    if [ "$2" = "$3" ]; then
        echo "  PASS: $1"
        pass=$((pass + 1))
    else
        echo "  FAIL: $1 (expected '$2', got '$3')"
        fail=$((fail + 1))
    fi
}

header() {
    awk -v name="$1:" 'tolower($1) == tolower(name) {
        sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]*$/, ""); print
    }' "$headers"
}

echo "--- Edge Functions CORS ---"
for origin in https://app.example.com https://other.example.com; do
    expected_origin=""
    expected_credentials=""
    expected_preflight=403
    if [ "$origin" = "https://app.example.com" ]; then
        expected_origin="$origin"
        expected_credentials=true
        expected_preflight=204
    fi

    for method in OPTIONS POST; do
        expected_status=200
        if [ "$method" = OPTIONS ]; then
            expected_status="$expected_preflight"
            # Browser preflights do not send authentication credentials.
            status=$(curl -sS --max-time 60 -o /dev/null -D "$headers" -w '%{http_code}' \
                -X OPTIONS "$BASE_URL/functions/v1/${function_dir##*/}" \
                -H "Origin: $origin" -H 'Access-Control-Request-Method: POST' \
                -H 'Access-Control-Request-Headers: authorization, content-type, x-custom-header')
        else
            status=$(curl -sS --max-time 60 -o /dev/null -D "$headers" -w '%{http_code}' \
                -X POST "$BASE_URL/functions/v1/${function_dir##*/}" \
                -H "Origin: $origin" -H "Authorization: Bearer $ANON_KEY")
        fi
        check "$method $origin status" "$expected_status" "$status"
        check "$method $origin reaches function" function "$(header X-Cors-Handler)"
        check "$method $origin allowed origin" "$expected_origin" "$(header Access-Control-Allow-Origin)"
        check "$method $origin credentials" "$expected_credentials" "$(header Access-Control-Allow-Credentials)"
        check "$method $origin varies by origin" Origin "$(header Vary)"
        if [ "$method" = OPTIONS ] && [ -n "$expected_origin" ]; then
            check "Preflight preserves function methods" POST "$(header Access-Control-Allow-Methods)"
            check "Preflight preserves custom headers" \
                'authorization, content-type, x-custom-header' "$(header Access-Control-Allow-Headers)"
        fi
    done
done

# Requests without Origin must not acquire CORS headers either.
status=$(curl -sS --max-time 60 -o /dev/null -D "$headers" -w '%{http_code}' \
    -X POST "$BASE_URL/functions/v1/${function_dir##*/}" \
    -H "Authorization: Bearer $ANON_KEY")
check "Request without Origin status" 200 "$status"
check "Request without Origin reaches function" function "$(header X-Cors-Handler)"
check "Request without Origin has no allowed origin" '' "$(header Access-Control-Allow-Origin)"

# The gateway must still handle CORS for the other API routes.
curl -sS --max-time 60 -o /dev/null -D "$headers" \
    -X OPTIONS "$BASE_URL/rest/v1/" -H 'Origin: https://other.example.com' \
    -H 'Access-Control-Request-Method: GET'
case "$(header Access-Control-Allow-Origin)" in
    '*'|https://other.example.com) rest_cors=true ;;
    *) rest_cors=false ;;
esac
check "REST CORS remains enabled" true "$rest_cors"

echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
