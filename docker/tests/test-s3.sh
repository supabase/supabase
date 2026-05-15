#!/bin/sh
#
# Test S3 protocol endpoint for self-hosted Supabase Storage.
#
# Verifies that the S3-compatible endpoint at /storage/v1/s3 works with
# standard S3 clients — the same way end users interact with it via
# aws cli, rclone, or other S3-compatible tools.
#
# Usage:
#   sh test-s3.sh              # Uses http://localhost:8000
#   sh test-s3.sh <base_url>   # Custom URL
#
# Prerequisites:
#   - Running self-hosted Supabase instance with S3 enabled:
#       docker compose -f docker-compose.yml -f docker-compose.s3.yml up -d
#   - .env file with S3_PROTOCOL_ACCESS_KEY_ID, S3_PROTOCOL_ACCESS_KEY_SECRET, REGION
#   - aws cli v2 (for S3 operations)
#   - jq (for JSON parsing)
#

set -e

cleanup_files=""
trap 'rm -f $cleanup_files' EXIT

BASE_URL="${1:-http://localhost:8000}"
S3_ENDPOINT="$BASE_URL/storage/v1/s3"

if [ ! -f .env ]; then
    echo "Error: .env file not found. Run from the project directory."
    exit 1
fi

for cmd in aws jq; do
    if ! command -v $cmd >/dev/null 2>&1; then
        echo "Error: $cmd not found."
        exit 1
    fi
done

# Read keys from .env
S3_ACCESS_KEY=$(grep '^S3_PROTOCOL_ACCESS_KEY_ID=' .env | cut -d= -f2-)
S3_SECRET_KEY=$(grep '^S3_PROTOCOL_ACCESS_KEY_SECRET=' .env | cut -d= -f2-)
REGION=$(grep '^REGION=' .env | cut -d= -f2-)

if [ -z "$S3_ACCESS_KEY" ] || [ -z "$S3_SECRET_KEY" ]; then
    echo "Error: S3_PROTOCOL_ACCESS_KEY_ID or S3_PROTOCOL_ACCESS_KEY_SECRET not set in .env"
    exit 1
fi

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

# Wrapper for aws s3/s3api commands with correct endpoint and credentials
s3() {
    AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" \
    aws "$@" --endpoint-url "$S3_ENDPOINT" --region "$REGION" 2>&1
}

bucket_name="s3-test-$$"

echo ""
echo "=== S3 protocol test against $BASE_URL ==="
echo ""

# ---------------------------------------------
# 1. S3 ListBuckets
# ---------------------------------------------

echo "--- S3 ListBuckets ---"
list_output=$(s3 s3api list-buckets --output json)
list_ok=$(echo "$list_output" | jq -r 'if .Buckets then "true" else "false" end' 2>/dev/null)
check "ListBuckets returns valid response" "true" "$list_ok"

# ---------------------------------------------
# 2. S3 CreateBucket
# ---------------------------------------------

echo ""
echo "--- S3 CreateBucket ---"
s3 s3api create-bucket --bucket "$bucket_name" --output json >/dev/null 2>&1

# Verify create succeeded
create_found=$(s3 s3api list-buckets --output json | \
    jq -r --arg name "$bucket_name" '[.Buckets[] | .Name] | if any(. == $name) then "true" else "false" end' 2>/dev/null)
check "CreateBucket" "true" "$create_found"

if [ "$create_found" != "true" ]; then
    echo "  Cannot continue without a bucket. Aborting."
    echo ""
    echo "=== Results: $pass passed, $fail failed ==="
    exit 1
fi

# Verify bucket appears in ListBuckets (separate call)
s3_bucket_found=$(s3 s3api list-buckets --output json | \
    jq -r --arg name "$bucket_name" '[.Buckets[] | .Name] | if any(. == $name) then "true" else "false" end' 2>/dev/null)
check "Bucket visible in ListBuckets" "true" "$s3_bucket_found"

# ---------------------------------------------
# 3. S3 PutObject
# ---------------------------------------------

echo ""
echo "--- S3 PutObject ---"
tmpfile=$(mktemp); cleanup_files="$cleanup_files $tmpfile"
echo "hello from s3 upload test" > "$tmpfile"
put_output=$(s3 s3 cp "$tmpfile" "s3://$bucket_name/s3-uploaded.txt")
put_ok=$(echo "$put_output" | grep -q "upload:" && echo "true" || echo "false")
check "PutObject upload" "true" "$put_ok"

# ---------------------------------------------
# 4. S3 ListObjectsV2
# ---------------------------------------------

echo ""
echo "--- S3 ListObjectsV2 ---"
list_objects=$(s3 s3api list-objects-v2 --bucket "$bucket_name" --output json)
object_found=$(echo "$list_objects" | \
    jq -r '[.Contents[]? | .Key] | if any(. == "s3-uploaded.txt") then "true" else "false" end' 2>/dev/null)
check "Object found in ListObjectsV2" "true" "$object_found"

# ---------------------------------------------
# 5. S3 HeadObject
# ---------------------------------------------

echo ""
echo "--- S3 HeadObject ---"
head_output=$(s3 s3api head-object --bucket "$bucket_name" --key "s3-uploaded.txt" --output json)
head_size=$(echo "$head_output" | jq -r '.ContentLength // 0' 2>/dev/null)
original_size=$(wc -c < "$tmpfile" | tr -d ' ')
check "HeadObject returns correct size" "$original_size" "$head_size"
rm -f "$tmpfile"

# ---------------------------------------------
# 6. S3 GetObject (download) + content verify
# ---------------------------------------------

echo ""
echo "--- S3 GetObject ---"
download_file=$(mktemp); cleanup_files="$cleanup_files $download_file"
s3 s3 cp "s3://$bucket_name/s3-uploaded.txt" "$download_file" >/dev/null
downloaded_content=$(cat "$download_file")
check "GetObject content matches" "hello from s3 upload test" "$downloaded_content"
rm -f "$download_file"

# ---------------------------------------------
# 7. S3 CopyObject (server-side copy)
# ---------------------------------------------

echo ""
echo "--- S3 CopyObject ---"
copy_output=$(s3 s3 cp "s3://$bucket_name/s3-uploaded.txt" "s3://$bucket_name/s3-copied.txt")
copy_ok=$(echo "$copy_output" | grep -q "copy:" && echo "true" || echo "false")
check "CopyObject" "true" "$copy_ok"

# Verify copied content
copy_download=$(mktemp); cleanup_files="$cleanup_files $copy_download"
s3 s3 cp "s3://$bucket_name/s3-copied.txt" "$copy_download" >/dev/null
check "Copied object content matches" "hello from s3 upload test" "$(cat "$copy_download")"
rm -f "$copy_download"

# ---------------------------------------------
# 8. S3 DeleteObject
# ---------------------------------------------

echo ""
echo "--- S3 DeleteObject ---"
s3 s3 rm "s3://$bucket_name/s3-copied.txt" >/dev/null
# Verify object is gone
list_after_delete=$(s3 s3api list-objects-v2 --bucket "$bucket_name" --output json)
copied_gone=$(echo "$list_after_delete" | \
    jq -r '[.Contents[]? | .Key] | if any(. == "s3-copied.txt") then "false" else "true" end' 2>/dev/null)
check "Deleted object no longer listed" "true" "$copied_gone"

# ---------------------------------------------
# 9. Multipart upload (>5MB triggers multipart)
# ---------------------------------------------

echo ""
echo "--- S3 multipart upload (7MB) ---"
large_file=$(mktemp); cleanup_files="$cleanup_files $large_file"
dd if=/dev/urandom of="$large_file" bs=1048576 count=7 2>/dev/null
large_size=$(wc -c < "$large_file" | tr -d ' ')
large_put=$(s3 s3 cp "$large_file" "s3://$bucket_name/large-file.bin")
large_ok=$(echo "$large_put" | grep -q "upload:" && echo "true" || echo "false")
check "Multipart upload (7MB)" "true" "$large_ok"

# Verify size via HeadObject
large_head=$(s3 s3api head-object --bucket "$bucket_name" --key "large-file.bin" --output json)
remote_size=$(echo "$large_head" | jq -r '.ContentLength // 0' 2>/dev/null)
check "Multipart upload size matches ($large_size bytes)" "$large_size" "$remote_size"

# Download and verify size
large_download=$(mktemp); cleanup_files="$cleanup_files $large_download"
s3 s3 cp "s3://$bucket_name/large-file.bin" "$large_download" >/dev/null
download_size=$(wc -c < "$large_download" | tr -d ' ')
check "Multipart download size matches" "$large_size" "$download_size"
rm -f "$large_file" "$large_download"

# ---------------------------------------------
# 10. Range request (partial GetObject)
# ---------------------------------------------

echo ""
echo "--- Range request ---"
range_file=$(mktemp); cleanup_files="$cleanup_files $range_file"
echo "hello range test content" > "$range_file"
s3 s3 cp "$range_file" "s3://$bucket_name/range-test.txt" >/dev/null
rm -f "$range_file"

range_download=$(mktemp); cleanup_files="$cleanup_files $range_download"
s3 s3api get-object --bucket "$bucket_name" --key "range-test.txt" \
    --range "bytes=0-4" "$range_download" --output json >/dev/null
range_content=$(cat "$range_download")
check "Range request returns partial content" "hello" "$range_content"
rm -f "$range_download"

# ---------------------------------------------
# 11. Presigned URLs
# ---------------------------------------------
# Storage supports S3 presigned URLs (query-parameter auth), but Kong's
# request-transformer adds an empty Authorization header when the Lua
# expression evaluates to nil. Storage sees typeof "" === "string" and
# enters parseAuthorizationHeader instead of parseQuerySignature.
# This test will pass once the Kong config is fixed.

echo ""
echo "--- Presigned URLs ---"
presign_file=$(mktemp); cleanup_files="$cleanup_files $presign_file"
echo "presigned content test" > "$presign_file"
s3 s3 cp "$presign_file" "s3://$bucket_name/presign-test.txt" >/dev/null
rm -f "$presign_file"

presigned_url=$(s3 s3 presign "s3://$bucket_name/presign-test.txt")
presign_body=$(curl -s "$presigned_url")
check "Presigned URL returns correct content" "presigned content test" "$presign_body"

# ---------------------------------------------
# 12. Authentication
# ---------------------------------------------

echo ""
echo "--- Authentication ---"
bad_output=$(AWS_ACCESS_KEY_ID="invalid-key" \
    AWS_SECRET_ACCESS_KEY="invalid-secret" \
    aws s3api list-buckets \
    --endpoint-url "$S3_ENDPOINT" \
    --region "$REGION" \
    --output json 2>&1 || true)
bad_ok=$(echo "$bad_output" | grep -qi "denied\|invalid\|error\|403\|401" && echo "true" || echo "false")
check "Invalid credentials rejected" "true" "$bad_ok"

# ---------------------------------------------
# 13. Cleanup
# ---------------------------------------------

echo ""
echo "--- Cleanup ---"
s3 s3 rm "s3://$bucket_name/" --recursive >/dev/null
s3 s3api delete-bucket --bucket "$bucket_name" >/dev/null
# Verify bucket is gone
bucket_gone=$(s3 s3api list-buckets --output json | \
    jq -r --arg name "$bucket_name" '[.Buckets[] | .Name] | if any(. == $name) then "false" else "true" end' 2>/dev/null)
check "Bucket deleted via S3" "true" "$bucket_gone"

# ---------------------------------------------
# Summary
# ---------------------------------------------

echo ""
echo "=== Results: $pass passed, $fail failed ==="
echo ""

if [ "$fail" -gt 0 ]; then
    exit 1
fi
