#!/bin/sh
#
# Smoke test for self-hosted Supabase - verifies core functionality end-to-end.
#
# Usage:
#   sh test-self-hosted.sh              # Uses http://localhost:8000
#   sh test-self-hosted.sh <base_url>   # Custom URL
#
# Prerequisites:
#   - Running self-hosted Supabase instance
#   - .env file with keys configured
#   - jq (for JSON parsing)
#

set -e

cleanup_files=""
trap 'rm -f $cleanup_files' EXIT

BASE_URL="${1:-http://localhost:8000}"

if [ ! -f .env ]; then
    echo "Error: .env file not found. Run from the project directory."
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq not found. Install it: https://jqlang.github.io/jq/download/"
    exit 1
fi

# Read keys from .env
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2-)
SERVICE_ROLE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
DASHBOARD_USERNAME=$(grep '^DASHBOARD_USERNAME=' .env | cut -d= -f2-)
DASHBOARD_PASSWORD=$(grep '^DASHBOARD_PASSWORD=' .env | cut -d= -f2-)

pass=0
fail=0

check() {
    test_name="$1"
    expected="$2"
    actual="$3"

    if [ "$actual" = "$expected" ]; then
        echo "  PASS: $test_name"
        pass=$((pass + 1))
    else
        echo "  FAIL: $test_name (expected $expected, got $actual)"
        fail=$((fail + 1))
    fi
}

http_status() {
    url="$1"
    shift
    curl -s -o /dev/null -w "%{http_code}" "$@" "$url"
}

http_body() {
    url="$1"
    shift
    curl -s "$@" "$url"
}

echo ""
echo "=== Self-hosted smoke test against $BASE_URL ==="
echo ""

# ---------------------------------------------
# 1. Container health (via docker compose)
# ---------------------------------------------

echo "--- Container health ---"
if command -v docker >/dev/null 2>&1; then
    container_status=$(docker compose ps --format json 2>/dev/null | jq -rs '
        [.[] | select(.State != "running" or (.Health != "" and .Health != "healthy"))]
        | (length | tostring) + "|" + ([.[] | .Service + ": State=" + .State + " Health=" + (.Health // "none")] | join(", "))
    ' 2>/dev/null || echo "?|")
    unhealthy="${container_status%%|*}"
    container_issues="${container_status#*|}"
    if [ "$unhealthy" = "0" ]; then
        check "All containers healthy" "0" "$unhealthy"
    elif [ "$unhealthy" = "?" ]; then
        echo "  SKIP: Could not check container health"
    else
        check "All containers healthy ($container_issues)" "0" "$unhealthy"
    fi
else
    echo "  SKIP: docker not available"
fi

# ---------------------------------------------
# 2. Studio dashboard
# ---------------------------------------------

echo ""
echo "--- Studio dashboard ---"
# Studio may redirect (307/302) after auth - follow redirects
check "Studio accessible with basic auth" "200" \
    "$(http_status "$BASE_URL/" -L -u "$DASHBOARD_USERNAME:$DASHBOARD_PASSWORD")"
check "Studio rejects without auth" "401" \
    "$(http_status "$BASE_URL/")"

# ---------------------------------------------
# 3. Auth: create user, sign in, get user, public signup, delete
# ---------------------------------------------

echo ""
echo "--- Auth: user lifecycle ---"

test_email="smoke-test-$$@example.com"
test_password="smoke-test-password-123456"

# Create user via admin API (works regardless of email autoconfirm setting)
create_resp=$(http_body "$BASE_URL/auth/v1/admin/users" \
    -X POST \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$test_email\",\"password\":\"$test_password\",\"email_confirm\":true}")

user_id=$(echo "$create_resp" | jq -r '.id // empty' 2>/dev/null)

if [ -n "$user_id" ]; then
    check "Create user (admin)" "true" "true"

    # Sign in via public endpoint
    signin_resp=$(http_body "$BASE_URL/auth/v1/token?grant_type=password" \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"password\":\"$test_password\"}")

    access_token=$(echo "$signin_resp" | jq -r '.access_token // empty' 2>/dev/null)

    if [ -n "$access_token" ]; then
        check "Sign in user" "true" "true"

        # Get user profile with session JWT
        check "Get user profile" "200" \
            "$(http_status "$BASE_URL/auth/v1/user" \
                -H "apikey: $ANON_KEY" \
                -H "Authorization: Bearer $access_token")"
    else
        check "Sign in user" "true" "false"
    fi

    # Delete user
    delete_status=$(http_status "$BASE_URL/auth/v1/admin/users/$user_id" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY")
    check "Delete user (admin)" "200" "$delete_status"
else
    check "Create user (admin)" "true" "false"
fi

# Public signup (optional — depends on email autoconfirm setting)
signup_email="smoke-signup-$$@example.com"
signup_resp=$(http_body "$BASE_URL/auth/v1/signup" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$signup_email\",\"password\":\"$test_password\"}")

signup_token=$(echo "$signup_resp" | jq -r '.access_token // empty' 2>/dev/null)
signup_user_id=$(echo "$signup_resp" | jq -r '.id // .user.id // empty' 2>/dev/null)

if [ -n "$signup_token" ]; then
    check "Public signup (autoconfirm on)" "true" "true"
else
    echo "  SKIP: Public signup (autoconfirm is off)"
fi

# Clean up signup user if created
if [ -n "$signup_user_id" ]; then
    http_status "$BASE_URL/auth/v1/admin/users/$signup_user_id" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null 2>&1
fi

# ---------------------------------------------
# 4. PostgREST: query
# ---------------------------------------------

echo ""
echo "--- PostgREST ---"
check "REST API query" "200" \
    "$(http_status "$BASE_URL/rest/v1/" \
        -H "apikey: $ANON_KEY")"

# ---------------------------------------------
# 5. GraphQL
# ---------------------------------------------

echo ""
echo "--- GraphQL ---"
gql_resp=$(http_body "$BASE_URL/graphql/v1" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}')
gql_has_data=$(echo "$gql_resp" | jq -r 'if .data then "true" else "false" end' 2>/dev/null)
check "GraphQL introspection" "true" "$gql_has_data"

# ---------------------------------------------
# 6. Storage: create bucket, upload >6MB file, download, cleanup
# ---------------------------------------------

echo ""
echo "--- Storage: bucket + file lifecycle ---"

bucket_name="smoke-test-$$"

# Create bucket
create_bucket_status=$(http_status "$BASE_URL/storage/v1/bucket" \
    -X POST \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$bucket_name\",\"name\":\"$bucket_name\",\"public\":true}")
check "Create bucket" "200" "$create_bucket_status"

if [ "$create_bucket_status" = "200" ]; then
    # Generate a ~7MB file
    tmpfile=$(mktemp); cleanup_files="$cleanup_files $tmpfile"
    dd if=/dev/urandom of="$tmpfile" bs=1048576 count=7 2>/dev/null

    # Upload file
    upload_status=$(http_status "$BASE_URL/storage/v1/object/$bucket_name/test-large-file.bin" \
        -X POST \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/octet-stream" \
        --data-binary "@$tmpfile")
    check "Upload 7MB file" "200" "$upload_status"

    # Download file and verify size
    download_size=$(curl -s \
        "$BASE_URL/storage/v1/object/public/$bucket_name/test-large-file.bin" | wc -c | tr -d ' ')
    original_size=$(wc -c < "$tmpfile" | tr -d ' ')
    check "Download file (size matches)" "true" \
        "$([ "$download_size" = "$original_size" ] && echo true || echo false)"

    rm -f "$tmpfile"

    # Signed URL: upload a small file, create signed URL, fetch without auth
    sign_upload_status=$(http_status "$BASE_URL/storage/v1/object/$bucket_name/sign-test.txt" \
        -X POST \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: text/plain" \
        --data-binary "signed url test content")
    check "Upload file for signing" "200" "$sign_upload_status"

    if [ "$sign_upload_status" = "200" ]; then
        sign_resp=$(http_body "$BASE_URL/storage/v1/object/sign/$bucket_name/sign-test.txt" \
            -X POST \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
            -H "Content-Type: application/json" \
            -d '{"expiresIn": 600}')
        signed_path=$(echo "$sign_resp" | jq -r '.signedURL // empty' 2>/dev/null)

        if [ -n "$signed_path" ]; then
            check "Create signed URL" "true" "true"
            # Fetch signed URL without any auth headers (goes through Kong)
            signed_content=$(curl -s "$BASE_URL/storage/v1$signed_path")
            check "Fetch signed URL (no auth)" "signed url test content" "$signed_content"
        else
            check "Create signed URL" "true" "false"
        fi
    fi

    # Delete file
    delete_file_status=$(http_status "$BASE_URL/storage/v1/object/$bucket_name/test-large-file.bin" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY")
    check "Delete file" "200" "$delete_file_status"

    # Delete signed test file
    http_status "$BASE_URL/storage/v1/object/$bucket_name/sign-test.txt" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null 2>&1

    # Delete bucket
    delete_bucket_status=$(http_status "$BASE_URL/storage/v1/bucket/$bucket_name" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY")
    check "Delete bucket" "200" "$delete_bucket_status"
fi

# ---------------------------------------------
# 7. Edge Functions
# ---------------------------------------------

echo ""
echo "--- Edge Functions ---"
fn_resp=$(http_body "$BASE_URL/functions/v1/hello" \
    -X POST \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')
check "Call hello function" '"Hello from Edge Functions!"' "$fn_resp"

# ---------------------------------------------
# 8. pg-meta (Studio backend)
# ---------------------------------------------

echo ""
echo "--- pg-meta ---"
check "pg-meta with service_role key" "200" \
    "$(http_status "$BASE_URL/pg/schemas" \
        -H "apikey: $SERVICE_ROLE_KEY")"
check "pg-meta rejects anon key" "403" \
    "$(http_status "$BASE_URL/pg/schemas" \
        -H "apikey: $ANON_KEY")"
check "pg-meta rejects no key" "401" \
    "$(http_status "$BASE_URL/pg/schemas")"

echo ""
echo "--- MCP (blocked by default) ---"
check "/api/mcp blocked" "403" \
    "$(http_status "$BASE_URL/api/mcp")"
check "/mcp blocked" "403" \
    "$(http_status "$BASE_URL/mcp")"

# ---------------------------------------------
# 9. Realtime
# ---------------------------------------------

echo ""
echo "--- Realtime ---"
check "Realtime health" "true" \
    "$([ "$(http_status "$BASE_URL/realtime/v1/api/tenants" \
        -H "apikey: $ANON_KEY")" != "401" ] && echo true || echo false)"

# ---------------------------------------------
# Summary
# ---------------------------------------------

echo ""
echo "=== Results: $pass passed, $fail failed ==="
echo ""

if [ "$fail" -gt 0 ]; then
    exit 1
fi
