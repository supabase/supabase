#!/bin/sh
#
# Test S3 backend directly, bypassing the Storage service.
#
# Validates that the S3-compatible backend (MinIO, RustFS, etc.) handles
# all S3 operations that Storage relies on. Uses the aws cli so the test
# is backend-agnostic — no vendor-specific tools required.
#
# Usage:
#   sh test-s3-backend.sh                   # Uses localhost:9100
#   sh test-s3-backend.sh <backend_url>     # Custom URL
#
# Prerequisites:
#   - Running self-hosted Supabase instance with S3 backend + test override:
#       docker compose -f docker-compose.yml -f docker-compose.s3.yml \
#         -f ./tests/docker-compose.s3.test.yml up -d
#   - .env file with MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, GLOBAL_S3_BUCKET
#   - aws cli v2
#   - jq (for JSON parsing)
#

set -e

cleanup_files=""
trap 'rm -f $cleanup_files' EXIT

BACKEND_URL="${1:-http://localhost:${S3_BACKEND_TEST_PORT:-9100}}"

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

# Read backend credentials from .env
BACKEND_ACCESS_KEY=$(grep '^MINIO_ROOT_USER=' .env | cut -d= -f2-)
BACKEND_SECRET_KEY=$(grep '^MINIO_ROOT_PASSWORD=' .env | cut -d= -f2-)
GLOBAL_S3_BUCKET=$(grep '^GLOBAL_S3_BUCKET=' .env | cut -d= -f2-)
REGION=$(grep '^REGION=' .env | cut -d= -f2-)
REGION="${REGION:-us-east-1}"

if [ -z "$BACKEND_ACCESS_KEY" ] || [ -z "$BACKEND_SECRET_KEY" ]; then
    echo "Error: MINIO_ROOT_USER or MINIO_ROOT_PASSWORD not set in .env"
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

# Wrapper for aws commands against the backend directly
s3() {
    AWS_ACCESS_KEY_ID="$BACKEND_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$BACKEND_SECRET_KEY" \
    aws "$@" --endpoint-url "$BACKEND_URL" --region "$REGION" 2>&1
}

bucket_name="backend-test-$$"

echo ""
echo "=== S3 backend test against $BACKEND_URL ==="
echo ""

# ---------------------------------------------
# 1. ListBuckets (backend reachable)
# ---------------------------------------------

echo "--- Connectivity ---"
list_output=$(s3 s3api list-buckets --output json)
list_ok=$(echo "$list_output" | jq -r 'if .Buckets then "true" else "false" end' 2>/dev/null)
check "Backend reachable (ListBuckets)" "true" "$list_ok"

if [ "$list_ok" != "true" ]; then
    echo "  Cannot reach backend. Is the test override running?"
    echo "  Response: $list_output"
    echo ""
    echo "=== Results: $pass passed, $fail failed ==="
    exit 1
fi

# ---------------------------------------------
# 2. Verify GLOBAL_S3_BUCKET exists
# ---------------------------------------------

echo ""
echo "--- Storage bucket ---"
if [ -n "$GLOBAL_S3_BUCKET" ]; then
    storage_bucket_exists=$(s3 s3api list-buckets --output json | \
        jq -r --arg name "$GLOBAL_S3_BUCKET" '[.Buckets[] | .Name] | if any(. == $name) then "true" else "false" end' 2>/dev/null)
    check "GLOBAL_S3_BUCKET ($GLOBAL_S3_BUCKET) exists" "true" "$storage_bucket_exists"
else
    echo "  SKIP: GLOBAL_S3_BUCKET not set"
fi

# ---------------------------------------------
# 3. CreateBucket
# ---------------------------------------------

echo ""
echo "--- CreateBucket ---"
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

# Verify in ListBuckets (separate call)
bucket_found=$(s3 s3api list-buckets --output json | \
    jq -r --arg name "$bucket_name" '[.Buckets[] | .Name] | if any(. == $name) then "true" else "false" end' 2>/dev/null)
check "Bucket visible in ListBuckets" "true" "$bucket_found"

# ---------------------------------------------
# 4. PutObject
# ---------------------------------------------

echo ""
echo "--- PutObject ---"
tmpfile=$(mktemp); cleanup_files="$cleanup_files $tmpfile"
echo "hello from backend test" > "$tmpfile"
put_output=$(s3 s3 cp "$tmpfile" "s3://$bucket_name/test-file.txt")
put_ok=$(echo "$put_output" | grep -q "upload:" && echo "true" || echo "false")
check "PutObject" "true" "$put_ok"

# ---------------------------------------------
# 5. ListObjectsV2
# ---------------------------------------------

echo ""
echo "--- ListObjectsV2 ---"
list_objects=$(s3 s3api list-objects-v2 --bucket "$bucket_name" --output json)
object_found=$(echo "$list_objects" | \
    jq -r '[.Contents[]? | .Key] | if any(. == "test-file.txt") then "true" else "false" end' 2>/dev/null)
check "Object found in ListObjectsV2" "true" "$object_found"

# ---------------------------------------------
# 6. HeadObject
# ---------------------------------------------

echo ""
echo "--- HeadObject ---"
head_output=$(s3 s3api head-object --bucket "$bucket_name" --key "test-file.txt" --output json)
head_size=$(echo "$head_output" | jq -r '.ContentLength // 0' 2>/dev/null)
original_size=$(wc -c < "$tmpfile" | tr -d ' ')
check "HeadObject returns correct size" "$original_size" "$head_size"
rm -f "$tmpfile"

# ---------------------------------------------
# 7. GetObject + content verify
# ---------------------------------------------

echo ""
echo "--- GetObject ---"
download_file=$(mktemp); cleanup_files="$cleanup_files $download_file"
s3 s3 cp "s3://$bucket_name/test-file.txt" "$download_file" >/dev/null
downloaded_content=$(cat "$download_file")
check "GetObject content matches" "hello from backend test" "$downloaded_content"
rm -f "$download_file"

# ---------------------------------------------
# 8. CopyObject
# ---------------------------------------------

echo ""
echo "--- CopyObject ---"
copy_output=$(s3 s3 cp "s3://$bucket_name/test-file.txt" "s3://$bucket_name/test-copy.txt")
copy_ok=$(echo "$copy_output" | grep -q "copy:" && echo "true" || echo "false")
check "CopyObject" "true" "$copy_ok"

copy_download=$(mktemp); cleanup_files="$cleanup_files $copy_download"
s3 s3 cp "s3://$bucket_name/test-copy.txt" "$copy_download" >/dev/null
check "Copied object content matches" "hello from backend test" "$(cat "$copy_download")"
rm -f "$copy_download"

# ---------------------------------------------
# 9. DeleteObject
# ---------------------------------------------

echo ""
echo "--- DeleteObject ---"
s3 s3 rm "s3://$bucket_name/test-copy.txt" >/dev/null
list_after_delete=$(s3 s3api list-objects-v2 --bucket "$bucket_name" --output json)
copy_gone=$(echo "$list_after_delete" | \
    jq -r '[.Contents[]? | .Key] | if any(. == "test-copy.txt") then "false" else "true" end' 2>/dev/null)
check "Deleted object no longer listed" "true" "$copy_gone"

# ---------------------------------------------
# 10. Multipart upload (7MB)
# ---------------------------------------------

echo ""
echo "--- Multipart upload (7MB) ---"
large_file=$(mktemp); cleanup_files="$cleanup_files $large_file"
dd if=/dev/urandom of="$large_file" bs=1048576 count=7 2>/dev/null
large_size=$(wc -c < "$large_file" | tr -d ' ')
large_put=$(s3 s3 cp "$large_file" "s3://$bucket_name/large-file.bin")
large_ok=$(echo "$large_put" | grep -q "upload:" && echo "true" || echo "false")
check "Multipart upload (7MB)" "true" "$large_ok"

large_head=$(s3 s3api head-object --bucket "$bucket_name" --key "large-file.bin" --output json)
remote_size=$(echo "$large_head" | jq -r '.ContentLength // 0' 2>/dev/null)
check "Multipart size matches ($large_size bytes)" "$large_size" "$remote_size"

large_download=$(mktemp); cleanup_files="$cleanup_files $large_download"
s3 s3 cp "s3://$bucket_name/large-file.bin" "$large_download" >/dev/null
download_size=$(wc -c < "$large_download" | tr -d ' ')
check "Multipart download size matches" "$large_size" "$download_size"
rm -f "$large_file" "$large_download"

# ---------------------------------------------
# 11. DeleteObjects (batch delete)
# ---------------------------------------------

echo ""
echo "--- DeleteObjects (batch) ---"
batch_file=$(mktemp); cleanup_files="$cleanup_files $batch_file"
echo "batch-a" > "$batch_file"
s3 s3 cp "$batch_file" "s3://$bucket_name/batch-a.txt" >/dev/null
echo "batch-b" > "$batch_file"
s3 s3 cp "$batch_file" "s3://$bucket_name/batch-b.txt" >/dev/null
echo "batch-c" > "$batch_file"
s3 s3 cp "$batch_file" "s3://$bucket_name/batch-c.txt" >/dev/null
rm -f "$batch_file"
delete_objects_output=$(s3 s3api delete-objects --bucket "$bucket_name" \
    --delete '{"Objects":[{"Key":"batch-a.txt"},{"Key":"batch-b.txt"},{"Key":"batch-c.txt"}]}' \
    --output json)
deleted_count=$(echo "$delete_objects_output" | jq -r '.Deleted | length' 2>/dev/null)
check "DeleteObjects removed 3 objects" "3" "$deleted_count"

# Verify all gone
batch_list=$(s3 s3api list-objects-v2 --bucket "$bucket_name" --prefix "batch-" --output json)
batch_remaining=$(echo "$batch_list" | jq -r '[.Contents[]?] | length' 2>/dev/null)
check "Batch-deleted objects gone" "0" "$batch_remaining"

# ---------------------------------------------
# 12. Presigned URLs
# ---------------------------------------------

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
# 13. Conditional request (IfNoneMatch)
# ---------------------------------------------

echo ""
echo "--- Conditional request (IfNoneMatch) ---"
# --if-none-match requires aws cli v2.22+ ; skip if not supported
if aws s3api put-object help 2>&1 | grep -q 'if-none-match'; then
    cond_file=$(mktemp); cleanup_files="$cleanup_files $cond_file"
    echo "conditional test" > "$cond_file"

    # First put should succeed (key doesn't exist)
    first_put_err=$(s3 s3api put-object --bucket "$bucket_name" --key "cond-test.txt" \
        --body "$cond_file" --if-none-match '*' --output json 2>&1 || true)
    first_put_ok=$(echo "$first_put_err" | grep -qi "error\|denied\|PreconditionFailed" && echo "false" || echo "true")
    check "IfNoneMatch put (new key) succeeds" "true" "$first_put_ok"

    # Second put should fail with PreconditionFailed (key exists)
    cond_err=$(s3 s3api put-object --bucket "$bucket_name" --key "cond-test.txt" \
        --body "$cond_file" --if-none-match '*' --output json 2>&1 || true)
    cond_rejected=$(echo "$cond_err" | grep -qi "PreconditionFailed" && echo "true" || echo "false")
    check "IfNoneMatch put (existing key) rejected" "true" "$cond_rejected"
    rm -f "$cond_file"
else
    echo "  SKIP: aws cli does not support --if-none-match (requires v2.22+)"
fi

# ---------------------------------------------
# 14. Range request (partial GetObject)
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
# 15. Authentication
# ---------------------------------------------

echo ""
echo "--- Authentication ---"
bad_output=$(AWS_ACCESS_KEY_ID="invalid-key" \
    AWS_SECRET_ACCESS_KEY="invalid-secret" \
    aws s3api list-buckets \
    --endpoint-url "$BACKEND_URL" \
    --region "$REGION" \
    --output json 2>&1 || true)
bad_ok=$(echo "$bad_output" | grep -qi "denied\|invalid\|error\|403\|401" && echo "true" || echo "false")
check "Invalid credentials rejected" "true" "$bad_ok"

# ---------------------------------------------
# 16. Cleanup
# ---------------------------------------------

echo ""
echo "--- Cleanup ---"
s3 s3 rm "s3://$bucket_name/" --recursive >/dev/null
s3 s3api delete-bucket --bucket "$bucket_name" >/dev/null
bucket_gone=$(s3 s3api list-buckets --output json | \
    jq -r --arg name "$bucket_name" '[.Buckets[] | .Name] | if any(. == $name) then "false" else "true" end' 2>/dev/null)
check "Test bucket deleted" "true" "$bucket_gone"

# ---------------------------------------------
# Summary
# ---------------------------------------------

echo ""
echo "=== Results: $pass passed, $fail failed ==="
echo ""

if [ "$fail" -gt 0 ]; then
    exit 1
fi
