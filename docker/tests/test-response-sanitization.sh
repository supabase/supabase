#!/bin/sh
#
# Response sanitization: the API gateway neutralizes responses that browsers
# would render as HTML or SVG on Storage, REST and Functions (GET only), as on
# the platform. Studio shares the gateway's origin, so script in user content
# must not run there. Creates a temporary public bucket, function and database
# function, checks the response headers, and removes them.
#
# Usage (from the docker/ directory of a running local stack):
#   sh tests/test-response-sanitization.sh              # Uses http://localhost:8000
#   sh tests/test-response-sanitization.sh <base_url>   # Custom URL
#

set -eu

BASE_URL="${1:-http://localhost:8000}"
CSP="default-src 'none'; sandbox"

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
bucket="sanitize-test-$suffix"
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
    header content-type | cut -d';' -f1 | tr -d ' '
}

psql_exec() {
    docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -c "$1" >/dev/null
}

# expect_html <description>: rewritten to text/plain with a sandbox CSP
expect_html() {
    check "$1: Content-Type is text/plain" "text/plain" "$(media_type)"
    check "$1: sandbox CSP" "$CSP" "$(header content-security-policy)"
    check "$1: nosniff" "nosniff" "$(header x-content-type-options)"
}

# expect_svg <description>: type kept, sandbox CSP, served as attachment
expect_svg() {
    check "$1: Content-Type is kept" "image/svg+xml" "$(media_type)"
    check "$1: sandbox CSP" "$CSP" "$(header content-security-policy)"
    check "$1: attachment" "attachment" "$(header content-disposition)"
    check "$1: nosniff" "nosniff" "$(header x-content-type-options)"
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
check "Upload PNG" "200" "$(upload image.png image/png 'not really a png')"

public="$BASE_URL/storage/v1/object/public/$bucket"
check "Public SVG" "200" "$(fetch GET "$public/image.svg")"
expect_svg "Public SVG"
check "Public XML" "200" "$(fetch GET "$public/data.xml")"
expect_html "Public XML"
check "Public HTML" "200" "$(fetch GET "$public/page.html")"
expect_html "Public HTML"
check "Public PNG" "200" "$(fetch GET "$public/image.png")"
check "Public PNG: Content-Type is kept" "image/png" "$(media_type)"
check "Public PNG: no CSP" "" "$(header content-security-policy)"
check "Public PNG: no nosniff" "" "$(header x-content-type-options)"

# --- Functions -------------------------------------------------------------

fn_dir=$(mktemp -d volumes/functions/sanitize-test-XXXXXX)
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
check "GET HTML" "200" "$(fetch GET "$fn_url?type=text/html")"
expect_html "GET HTML"
check "GET SVG" "200" "$(fetch GET "$fn_url?type=image/svg%2Bxml")"
expect_svg "GET SVG"
check "GET JSON" "200" "$(fetch GET "$fn_url?type=application/json")"
check "GET JSON: Content-Type is kept" "application/json" "$(media_type)"
check "GET JSON: no CSP" "" "$(header content-security-policy)"
check "GET JSON: nosniff (no file extension)" "nosniff" "$(header x-content-type-options)"
check "POST HTML" "200" "$(fetch POST "$fn_url?type=text/html" -d x)"
check "POST HTML: Content-Type is kept (not GET)" "text/html" "$(media_type)"
check "POST HTML: no CSP (not GET)" "" "$(header content-security-policy)"

# --- REST ------------------------------------------------------------------

echo "--- REST ---"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^supabase-db$'; then
    rest_fn="sanitize_test_$suffix"
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
    expect_html "RPC returning HTML"
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
