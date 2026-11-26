#!/bin/sh
#
# Exercise every public error code returned by the Functions main service.
# Uses real workers on the running stack. CPU and memory limits are tested
# separately. The idle timeout case takes 150 seconds, so a full run takes
# about three minutes.
# Authentication cases are skipped when the running service disables VERIFY_JWT.
#
# Usage (from the docker/ directory of a running local stack):
#   sh tests/test-functions-codes.sh              # Uses http://localhost:8000
#   sh tests/test-functions-codes.sh <base_url>   # Custom URL
#
# Prerequisites: curl, jq and Docker access to the running functions service.
# Temporary functions and response files are removed on exit.
#

set -eu

BASE_URL="${1:-http://localhost:8000}"
BASE_URL=${BASE_URL%/}
ORIGIN=https://app.example.com

if [ ! -f .env ] || [ ! -d volumes/functions ]; then
    echo "Error: run from the docker/ directory of the running stack."
    exit 1
fi

for cmd in curl jq docker; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: $cmd not found."
        exit 1
    fi
done

container_id=$(docker compose ps -q functions)
if [ -z "$container_id" ]; then
    echo "Error: the functions service is not running."
    exit 1
fi
# Read the live setting: .env may have changed since the container started.
if ! VERIFY_JWT=$(docker exec "$container_id" printenv VERIFY_JWT); then
    echo "Error: cannot read VERIFY_JWT from the functions service."
    exit 1
fi
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2-)
if [ "$VERIFY_JWT" = true ] && [ -z "$ANON_KEY" ]; then
    echo "Error: ANON_KEY is required when VERIFY_JWT is enabled."
    exit 1
fi

fn_dir=""
response_dir=""
fixtures="boot worker invalid-status app-error cpu memory idle"
cleanup() {
    if [ -n "$fn_dir" ]; then
        rm -rf "$fn_dir"
        for fixture in $fixtures; do
            rm -rf "$fn_dir-$fixture"
        done
    fi
    if [ -n "$response_dir" ]; then
        rm -rf "$response_dir"
    fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

fn_dir=$(mktemp -d volumes/functions/codes-test-XXXXXX)
response_dir=$(mktemp -d)
headers="$response_dir/headers"
body="$response_dir/body"
fn_url="$BASE_URL/functions/v1/${fn_dir##*/}"
for fixture in $fixtures; do
    mkdir "$fn_dir-$fixture"
done

cat > "$fn_dir/index.ts" <<'EOF'
Deno.serve(() => Response.json({ ok: true }))
EOF

cat > "$fn_dir-boot/index.ts" <<'EOF'
const broken = ;
Deno.serve(() => new Response('unexpected'))
EOF

# Top-level exceptions reach main as InvalidWorkerResponse. Exceptions inside
# a Deno.serve handler instead become the worker's own HTTP 500 response.
cat > "$fn_dir-worker/index.ts" <<'EOF'
throw new Error('functions-codes: intentional worker failure')
Deno.serve(() => new Response('unexpected'))
EOF

cat > "$fn_dir-invalid-status/index.ts" <<'EOF'
new Response(null, { status: 700 })
Deno.serve(() => new Response('unexpected'))
EOF

cat > "$fn_dir-app-error/index.ts" <<'EOF'
Deno.serve(() => Response.json({ intentional: true }, {
  status: 500,
  headers: {
    'Access-Control-Allow-Origin': 'https://app.example.com',
    'Access-Control-Expose-Headers': 'x-function-test',
    'x-function-test': 'preserved',
  },
}))
EOF

# Exhaust resources before opening an HTTP server. Otherwise its connection can
# close during shutdown and race main's error response. Bound both workloads
# even if a runtime stops enforcing its worker limits.
cat > "$fn_dir-cpu/index.ts" <<'EOF'
const end = Date.now() + 10000
while (Date.now() < end) {}
Deno.serve(() => new Response('CPU limit did not trigger'))
EOF

cat > "$fn_dir-memory/index.ts" <<'EOF'
const blocks = []
for (let i = 0; i < 48; i++) {
  blocks.push(new Uint8Array(8 * 1024 * 1024).fill(1))
}
Deno.serve(() => new Response(`Memory limit did not trigger: ${blocks.length}`))
EOF

cat > "$fn_dir-idle/index.ts" <<'EOF'
Deno.serve(async () => {
  await new Promise((resolve) => setTimeout(resolve, 180000))
  return new Response('Idle timeout did not trigger')
})
EOF

# The runtime container may run as a different user.
chmod 755 "$fn_dir"
chmod 644 "$fn_dir/index.ts"
for fixture in $fixtures; do
    chmod 755 "$fn_dir-$fixture"
    chmod 644 "$fn_dir-$fixture/index.ts"
done

pass=0
fail=0
skip=0
request_timeout=30

check() {
    if [ "$3" = "$2" ]; then
        echo "  PASS: $1"
        pass=$((pass + 1))
    else
        echo "  FAIL: $1 (expected '$2', got '$3')"
        fail=$((fail + 1))
    fi
}

# header <name>: value from the last response, including case-insensitive names.
header() {
    awk -v name="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]'):" \
        'tolower($1) == name { sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]*$/, ""); print }' "$headers"
}

# has_header_token <header> <token>: membership in a comma-separated header.
has_header_token() {
    header "$1" | tr ',' '\n' | awk -v token="$2" '
        { gsub(/^[[:space:]]+|[[:space:]]+$/, ""); if (tolower($0) == token) found = 1 }
        END { print found ? "yes" : "no" }'
}

json_field() {
    jq -r --arg field "$1" '.[$field] // empty' "$body" 2>/dev/null || true
}

# fetch <url> [curl args...]: keep status, headers and body for assertions.
fetch() {
    : > "$headers"
    : > "$body"
    status=$(curl -sS --connect-timeout 5 --max-time "$request_timeout" \
        -D "$headers" -o "$body" -w '%{http_code}' \
        -H "Origin: $ORIGIN" "$@") || true
}

invoke() {
    if [ "$VERIFY_JWT" = true ]; then
        fetch "$1" -H "Authorization: Bearer $ANON_KEY"
    else
        fetch "$1"
    fi
}

# expect_error <description> <http status> <code> <message>
expect_error() {
    check "$1: HTTP status" "$2" "$status"
    check "$1: sb-error-code header" "$3" "$(header sb-error-code)"
    check "$1: JSON code" "$3" "$(json_field code)"
    check "$1: JSON message" "$4" "$(json_field message)"
    check "$1: Content-Type" "application/json" "$(header content-type | cut -d';' -f1)"
    check "$1: CORS origin" "*" "$(header access-control-allow-origin)"
    for token in authorization x-client-info apikey; do
        check "$1: CORS allows $token" "yes" "$(has_header_token access-control-allow-headers "$token")"
    done
    check "$1: CORS exposes sb-error-code" "yes" "$(has_header_token access-control-expose-headers sb-error-code)"
}

# auth_case <code> <message> [curl args...]
auth_case() {
    auth_code=$1
    auth_message=$2
    shift 2
    if [ "$VERIFY_JWT" != true ]; then
        echo "  SKIP: $auth_code (VERIFY_JWT is disabled)"
        skip=$((skip + 1))
        return
    fi
    fetch "$fn_url" "$@"
    expect_error "$auth_code" 401 "$auth_code" "$auth_message"
    check "$auth_code: legacy msg" "$auth_message" "$(json_field msg)"
}

echo "--- Edge Functions error codes ---"
invoke "$fn_url"
check "Successful function: HTTP status" 200 "$status"
check "Successful function: body" true "$(json_field ok)"
check "Successful function: no error header" "" "$(header sb-error-code)"

echo "--- Authentication ---"
auth_case UNAUTHORIZED_NO_AUTH_HEADER 'Missing authorization header'
auth_case UNAUTHORIZED_INVALID_JWT_FORMAT 'Invalid JWT format' \
    -H 'Authorization: Bearer not-a-jwt'
# Fixed JWT headers select the algorithm; each signature is deliberately invalid.
auth_case UNAUTHORIZED_UNSUPPORTED_TOKEN_ALGORITHM 'Unsupported JWT algorithm HS512' \
    -H 'Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.e30.AA'
auth_case UNAUTHORIZED_LEGACY_JWT 'Invalid JWT' \
    -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.e30.AA'
auth_case UNAUTHORIZED_ASYMMETRIC_JWT 'Invalid JWT' \
    -H 'Authorization: Bearer eyJhbGciOiJFUzI1NiJ9.e30.AA'

echo "--- Dispatch and worker errors ---"
invoke "$fn_url-missing"
expect_error NOT_FOUND 404 NOT_FOUND 'Requested function was not found'

invoke "$fn_url-boot"
expect_error BOOT_ERROR 503 BOOT_ERROR 'Function failed to start (please check logs)'

invoke "$fn_url-worker"
expect_error WORKER_ERROR 500 WORKER_ERROR 'Function exited due to an error (please check logs)'

invoke "$fn_url-invalid-status"
expect_error INVALID_RESPONSE_STATUS_CODE 500 INVALID_RESPONSE_STATUS_CODE \
    'Function returned an invalid HTTP status code (please check logs)'

# The function owns this body and its CORS policy. Main only labels the error.
invoke "$fn_url-app-error"
check "EDGE_FUNCTION_ERROR: HTTP status" 500 "$status"
check "EDGE_FUNCTION_ERROR: sb-error-code header" EDGE_FUNCTION_ERROR "$(header sb-error-code)"
check "EDGE_FUNCTION_ERROR: original body" '{"intentional":true}' "$(cat "$body")"
check "EDGE_FUNCTION_ERROR: original header" preserved "$(header x-function-test)"
check "EDGE_FUNCTION_ERROR: original CORS origin" "$ORIGIN" "$(header access-control-allow-origin)"
check "EDGE_FUNCTION_ERROR: original exposed header" yes "$(has_header_token access-control-expose-headers x-function-test)"
check "EDGE_FUNCTION_ERROR: CORS exposes sb-error-code" yes "$(has_header_token access-control-expose-headers sb-error-code)"

echo "--- Worker resource limits ---"
invoke "$fn_url-cpu"
expect_error 'CPU limit' 546 WORKER_RESOURCE_LIMIT \
    'Function failed due to not having enough compute resources (please check logs)'

invoke "$fn_url-memory"
expect_error 'Memory limit' 546 WORKER_RESOURCE_LIMIT \
    'Function failed due to not having enough compute resources (please check logs)'

echo "--- Request idle timeout (150 seconds) ---"
request_timeout=180
invoke "$fn_url-idle"
expect_error IDLE_TIMEOUT 504 IDLE_TIMEOUT 'Request idle timeout limit (150s) reached'

echo ""
echo "=== Results: $pass passed, $fail failed, $skip skipped ==="
[ "$fail" -eq 0 ]
