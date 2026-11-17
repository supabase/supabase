#!/bin/sh
#
# Response sandboxing: the API gateway adds a sandbox Content-Security-Policy
# to Storage, REST and Functions responses, since Studio shares the
# gateway's origin. Content types are kept. Creates a temporary
# public bucket, function and database function, checks the response headers,
# and removes them.
#
# Usage (from the docker/ directory of a running local stack):
#   sh tests/test-response-sandbox.sh              # Uses http://localhost:8000
#   sh tests/test-response-sandbox.sh <base_url>   # Custom URL
#

set -eu

BASE_URL="${1:-http://localhost:8000}"
CSP="default-src 'none'; media-src 'self'; style-src 'unsafe-inline'; sandbox"

if [ ! -f .env ] || [ ! -d volumes/functions ]; then
    echo "Error: run from the docker/ directory of the running stack."
    exit 1
fi

env_value() { grep "^$1=" .env | cut -d= -f2-; }
SERVICE_ROLE_KEY=$(env_value SERVICE_ROLE_KEY)
ANON_KEY=$(env_value ANON_KEY)
DASHBOARD_USERNAME=$(env_value DASHBOARD_USERNAME)
DASHBOARD_PASSWORD=$(env_value DASHBOARD_PASSWORD)

suffix=$(date +%s)
bucket="sandbox-test-$suffix"
fn_dir=""
headers=""
rest_fn=""
rest_domain_created=no

cleanup() {
    curl -s --max-time 30 -o /dev/null -X POST "$BASE_URL/storage/v1/bucket/$bucket/empty" \
        -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" || true
    curl -s --max-time 30 -o /dev/null -X DELETE "$BASE_URL/storage/v1/bucket/$bucket" \
        -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" || true
    if [ -n "$rest_fn" ]; then
        psql_exec "drop function if exists public.$rest_fn(); notify pgrst, 'reload schema';" || true
    fi
    if [ "$rest_domain_created" = yes ]; then
        psql_exec 'drop domain if exists "text/html";' || true
    fi
    rm -rf "$fn_dir" "$headers"
}
trap cleanup EXIT
headers=$(mktemp)

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

# header <name>: value from the last response
header() {
    awk -v name="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]'):" \
        'tolower($1) == name { sub(/^[^:]*:[[:space:]]*/, ""); sub(/[[:space:]]*$/, ""); print }' "$headers"
}

# fetch <method> <url> [curl args...]: status of the request, headers kept for header()
fetch() {
    method=$1
    url=$2
    shift 2
    : > "$headers"
    curl -s --max-time 30 -o /dev/null -D "$headers" -w '%{http_code}' -X "$method" "$url" "$@" || true
}

# media_type: Content-Type of the last response without parameters (Kong adds a charset)
media_type() {
    header content-type | cut -d';' -f1 | tr -d ' ' | tr '[:upper:]' '[:lower:]'
}

psql_exec() {
    docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "$1" >/dev/null
}

# expect_sandboxed <description> [media type]: sandbox CSP, type kept
expect_sandboxed() {
    if [ -n "${2:-}" ]; then
        check "$1: Content-Type is kept" "$2" "$(media_type)"
    fi
    check "$1: sandbox CSP" "$CSP" "$(header content-security-policy)"
}

# --- Storage ---------------------------------------------------------------

upload() {
    curl -s --max-time 30 -o /dev/null -w '%{http_code}' -X POST \
        "$BASE_URL/storage/v1/object/$bucket/$1" \
        -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: $2" --data-binary "$3"
}

echo "--- Storage ---"
status=$(curl -s --max-time 30 -o /dev/null -w '%{http_code}' -X POST "$BASE_URL/storage/v1/bucket" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"id\":\"$bucket\",\"name\":\"$bucket\",\"public\":true}")
check "Create public bucket" "200" "$status"
check "Upload SVG" "200" "$(upload image.svg image/svg+xml '<svg xmlns="http://www.w3.org/2000/svg"/>')"
check "Upload XML" "200" "$(upload data.xml application/xml '<a/>')"
check "Upload HTML" "200" "$(upload page.html text/html '<h1>x</h1>')"
check "Upload +xml" "200" "$(upload note.txt application/rdf+xml '<a/>')"
check "Upload PNG" "200" "$(upload image.png image/png 'not really a png')"

public="$BASE_URL/storage/v1/object/public/$bucket"
check "Public SVG" "200" "$(fetch GET "$public/image.svg")"
expect_sandboxed "Public SVG" "image/svg+xml"
check "Public XML" "200" "$(fetch GET "$public/data.xml")"
expect_sandboxed "Public XML" "application/xml"
# Storage itself may serve HTML as text/plain, so only the headers are checked
check "Public HTML" "200" "$(fetch GET "$public/page.html")"
expect_sandboxed "Public HTML"
check "Public +xml" "200" "$(fetch GET "$public/note.txt")"
expect_sandboxed "Public +xml" "application/rdf+xml"
check "Public PNG" "200" "$(fetch GET "$public/image.png")"
expect_sandboxed "Public PNG" "image/png"

# S3 clients reject S3 protocol responses that aren't XML
fetch GET "$BASE_URL/storage/v1/s3/$bucket" >/dev/null
expect_sandboxed "S3 protocol error" "application/xml"

# --- Functions -------------------------------------------------------------

fn_dir=$(mktemp -d volumes/functions/sandbox-test-XXXXXX)
fn_url="$BASE_URL/functions/v1/${fn_dir##*/}"
cat > "$fn_dir/index.ts" <<'EOF'
Deno.serve((req) => {
  const type = new URL(req.url).searchParams.get('type') ?? 'text/html'
  return new Response('<h1>x</h1>', { headers: { 'Content-Type': type } })
})
EOF
# The runtime container may run as a different user.
chmod 755 "$fn_dir"
chmod 644 "$fn_dir/index.ts"

echo "--- Functions ---"
# Authenticated, so the checks also work when FUNCTIONS_VERIFY_JWT is true
check "GET HTML" "200" "$(fetch GET "$fn_url?type=text/html" -H "Authorization: Bearer $ANON_KEY")"
expect_sandboxed "GET HTML" "text/html"
# Media types are case-insensitive for browsers
check "GET Text/HTML" "200" "$(fetch GET "$fn_url?type=Text/HTML" -H "Authorization: Bearer $ANON_KEY")"
expect_sandboxed "GET Text/HTML" "text/html"
check "GET SVG" "200" "$(fetch GET "$fn_url?type=image/svg%2Bxml" -H "Authorization: Bearer $ANON_KEY")"
expect_sandboxed "GET SVG" "image/svg+xml"
check "GET JSON" "200" "$(fetch GET "$fn_url?type=application/json" -H "Authorization: Bearer $ANON_KEY")"
expect_sandboxed "GET JSON" "application/json"
check "POST HTML" "200" "$(fetch POST "$fn_url?type=text/html" -H "Authorization: Bearer $ANON_KEY" -d x)"
expect_sandboxed "POST HTML" "text/html"

# --- REST ------------------------------------------------------------------

echo "--- REST ---"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^supabase-db$'; then
    rest_fn="sandbox_test_$suffix"
    if [ -z "$(docker exec supabase-db psql -U postgres -d postgres -tAc "select 1 from pg_type where typname = 'text/html'")" ]; then
        rest_domain_created=yes
    fi
    # PostgREST serves a function returning the "text/html" domain as text/html
    psql_exec "do \$\$ begin create domain \"text/html\" as text; exception when duplicate_object then null; end \$\$;
        create function public.$rest_fn() returns \"text/html\" language sql as \$\$ select '<h1>x</h1>'::\"text/html\" \$\$;
        grant execute on function public.$rest_fn() to anon;
        notify pgrst, 'reload schema';"
    rest_status=""
    for _ in 1 2 3 4 5 6 7 8 9 10; do
        rest_status=$(fetch GET "$BASE_URL/rest/v1/rpc/$rest_fn" -H "apikey: $ANON_KEY" -H 'Accept: text/html')
        [ "$rest_status" = "200" ] && break
        sleep 1
    done
    check "RPC returning HTML" "200" "$rest_status"
    expect_sandboxed "RPC returning HTML" "text/html"
else
    echo "  SKIP: REST HTML checks (database container not running)"
fi

# --- Not affected ----------------------------------------------------------

echo "--- Not affected ---"
check "Studio page" "200" "$(fetch GET "$BASE_URL/project/default" -u "$DASHBOARD_USERNAME:$DASHBOARD_PASSWORD")"
check "Studio page: still text/html" "text/html" "$(media_type)"
[ "$(header content-security-policy)" = "$CSP" ] && studio_sandboxed=yes || studio_sandboxed=no
check "Studio page: no sandbox CSP" "no" "$studio_sandboxed"

echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
