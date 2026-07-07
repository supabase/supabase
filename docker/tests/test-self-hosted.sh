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
#   - sha256sum or shasum (for file integrity checks)
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

# Portable file hash: prefers sha256sum (Linux), falls back to shasum (macOS)
if command -v sha256sum >/dev/null 2>&1; then
    file_hash() { sha256sum "$1" | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
    file_hash() { shasum -a 256 "$1" | awk '{print $1}'; }
else
    echo "Error: sha256sum or shasum not found."
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
check "REST API route with anon key" "403" \
    "$(http_status "$BASE_URL/rest/v1/" \
        -H "apikey: $ANON_KEY")"

echo ""
echo "--- PostgREST ---"
check "REST API route with service role key" "200" \
    "$(http_status "$BASE_URL/rest/v1/" \
        -H "apikey: $SERVICE_ROLE_KEY")"

# ---------------------------------------------
# 5. GraphQL
# ---------------------------------------------

echo ""
echo "--- GraphQL (optional; off by default) ---"
# pg_graphql is OFF by default since the PG17 image (the image drops the extension
# on init, matching platform behavior for new projects), but users may enable it
# (Studio extensions UI / CREATE EXTENSION pg_graphql). Both are valid states. A
# healthy endpoint returns HTTP 200 either way:
#   enabled  => {"data": ...}
#   disabled => {"errors":[{"message":"pg_graphql extension is not enabled."}]}
# Assert the status AND the response shape, so a non-200, non-JSON, or empty body
# (a real gateway/runtime failure) is not silently classified as "disabled".
gql_status=$(http_status "$BASE_URL/graphql/v1" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}')
gql_body=$(http_body "$BASE_URL/graphql/v1" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}')
if [ "$gql_status" = "200" ] && echo "$gql_body" | jq -e '.data' >/dev/null 2>&1; then
    gql_state="enabled"
elif [ "$gql_status" = "200" ] && echo "$gql_body" | jq -e '.errors' >/dev/null 2>&1; then
    gql_state="disabled"
else
    gql_state="unhealthy (HTTP $gql_status)"
fi
case "$gql_state" in
    enabled | disabled) gql_health="healthy" ;;
    *) gql_health="unhealthy" ;;
esac
check "GraphQL endpoint healthy" "healthy" "$gql_health"
echo "  (GraphQL is $gql_state)"

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

    # Download file and verify integrity
    download_tmp=$(mktemp); cleanup_files="$cleanup_files $download_tmp"
    curl -s "$BASE_URL/storage/v1/object/public/$bucket_name/test-large-file.bin" -o "$download_tmp"
    original_size=$(wc -c < "$tmpfile" | tr -d ' ')
    download_size=$(wc -c < "$download_tmp" | tr -d ' ')
    check "Download file (size matches)" "$original_size" "$download_size"
    original_hash=$(file_hash "$tmpfile")
    download_hash=$(file_hash "$download_tmp")
    check "Download file (hash matches)" "$original_hash" "$download_hash"
    rm -f "$download_tmp"

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
# 6b. Storage: TUS resumable upload
# ---------------------------------------------

echo ""
echo "--- Storage: TUS resumable upload ---"

tus_bucket="smoke-tus-$$"

tus_bucket_status=$(http_status "$BASE_URL/storage/v1/bucket" \
    -X POST \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$tus_bucket\",\"name\":\"$tus_bucket\",\"public\":true}")
check "TUS: create bucket" "200" "$tus_bucket_status"

if [ "$tus_bucket_status" = "200" ]; then
    # Generate a ~7MB file (above Studio's 6MB TUS threshold)
    tusfile=$(mktemp); cleanup_files="$cleanup_files $tusfile"
    dd if=/dev/urandom of="$tusfile" bs=1048576 count=7 2>/dev/null
    tus_file_size=$(wc -c < "$tusfile" | tr -d ' ')
    tus_chunk_size=$((4 * 1048576))  # 4MB first chunk

    # Encode TUS metadata values as base64
    tus_bucket_b64=$(printf '%s' "$tus_bucket" | base64)
    tus_object_b64=$(printf '%s' "tus-test-file.bin" | base64)
    tus_mime_b64=$(printf '%s' "application/octet-stream" | base64)

    # 1. Create resumable upload
    tus_create_resp=$(curl -s -i -X POST \
        "$BASE_URL/storage/v1/upload/resumable" \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Tus-Resumable: 1.0.0" \
        -H "Upload-Length: $tus_file_size" \
        -H "Upload-Metadata: bucketName $tus_bucket_b64,objectName $tus_object_b64,contentType $tus_mime_b64" \
        -H "x-upsert: true")
    tus_create_status=$(echo "$tus_create_resp" | grep -m1 '^HTTP/' | grep -o '[0-9][0-9][0-9]')
    # Supabase Storage always returns an absolute Location URL (see generateUrl in storage/src/http/routes/tus/lifecycle.ts)
    tus_location=$(echo "$tus_create_resp" | grep -i '^location:' | tr -d '\r' | sed 's/^[Ll]ocation: *//')
    check "TUS: create resumable upload" "201" "$tus_create_status"

    if [ -n "$tus_location" ]; then
        # 2. Upload first chunk (0 to 4MB)
        tus_chunk1_status=$(dd if="$tusfile" bs=1048576 count=4 2>/dev/null | \
            curl -s -o /dev/null -w "%{http_code}" -X PATCH \
            "$tus_location" \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
            -H "Tus-Resumable: 1.0.0" \
            -H "Upload-Offset: 0" \
            -H "Content-Type: application/offset+octet-stream" \
            --data-binary @-)
        check "TUS: upload chunk 1 (4MB)" "204" "$tus_chunk1_status"

        # 3. Upload second chunk (4MB to end)
        tus_remaining=$((tus_file_size - tus_chunk_size))
        tus_chunk2_status=$(dd if="$tusfile" bs=1048576 skip=4 count=3 2>/dev/null | \
            curl -s -o /dev/null -w "%{http_code}" -X PATCH \
            "$tus_location" \
            -H "apikey: $SERVICE_ROLE_KEY" \
            -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
            -H "Tus-Resumable: 1.0.0" \
            -H "Upload-Offset: $tus_chunk_size" \
            -H "Content-Type: application/offset+octet-stream" \
            --data-binary @-)
        check "TUS: upload chunk 2 (remaining)" "204" "$tus_chunk2_status"

        # 4. Verify download matches original (hash check proves correct chunk reassembly)
        tus_download_tmp=$(mktemp); cleanup_files="$cleanup_files $tus_download_tmp"
        curl -s "$BASE_URL/storage/v1/object/public/$tus_bucket/tus-test-file.bin" -o "$tus_download_tmp"
        tus_download_size=$(wc -c < "$tus_download_tmp" | tr -d ' ')
        check "TUS: download size matches" "$tus_file_size" "$tus_download_size"
        tus_original_hash=$(file_hash "$tusfile")
        tus_download_hash=$(file_hash "$tus_download_tmp")
        check "TUS: download hash matches" "$tus_original_hash" "$tus_download_hash"
        rm -f "$tus_download_tmp"
    fi

    rm -f "$tusfile"

    # Cleanup: delete file and bucket
    http_status "$BASE_URL/storage/v1/object/$tus_bucket/tus-test-file.bin" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null 2>&1

    tus_delete_bucket=$(http_status "$BASE_URL/storage/v1/bucket/$tus_bucket" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY")
    check "TUS: delete bucket" "200" "$tus_delete_bucket"
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
check "Realtime health (ping)" "200" \
    "$(http_status "$BASE_URL/realtime/v1/api/ping" \
        -H "apikey: $ANON_KEY")"

# Management endpoints must be blocked at the gateway (even with a valid key)
check "Realtime /api/tenants blocked" "403" \
    "$(http_status "$BASE_URL/realtime/v1/api/tenants" \
        -H "apikey: $ANON_KEY")"
check "Realtime /api/openapi blocked" "403" \
    "$(http_status "$BASE_URL/realtime/v1/api/openapi" \
        -H "apikey: $ANON_KEY")"

# ---------------------------------------------
# Summary
# ---------------------------------------------

echo ""
echo "=== Results: $pass passed, $fail failed ==="
echo ""

if [ "$fail" -gt 0 ]; then
    exit 1
fi
