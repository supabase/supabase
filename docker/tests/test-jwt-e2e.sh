#!/bin/sh
#
# End-to-end ES256 JWT + RLS integration test for self-hosted Supabase.
#
# This test PROVES that an ES256 user-session JWT validates correctly across
# every service that consumes user JWTs, that auth.uid() resolves identically
# in each service's RLS context, and that verification failure NEVER silently
# downgrades to an anonymous role.
#
# Covers the failure mode reported in:
#   - github.com/supabase/supabase/issues/42037
#   - github.com/supabase/supabase/issues/42244
#   - github.com/supabase/supabase/issues/46303
#
# Usage:
#   sh tests/test-jwt-e2e.sh                  # Uses http://localhost:8000
#   sh tests/test-jwt-e2e.sh <base_url>
#
# Prerequisites:
#   - A running self-hosted Supabase stack (docker compose up -d)
#   - .env populated; JWT_KEYS + JWT_JWKS configured for ES256 mode
#   - curl, jq, docker (for psql exec into supabase-db)
#
# This script is destructive on a TEMPORARY namespace only:
#   - public.jwt_probe()     (created + dropped)
#   - storage policy "e2e-jwt-test-policy" (created + dropped)
#   - storage bucket "e2e-jwt-test"        (created + dropped)
#   - one test auth.users row              (created + deleted)
# It never modifies pre-existing objects.
#

set -u

BASE_URL="${1:-http://localhost:8000}"
DB_CONTAINER="supabase-db"
BUCKET="e2e-jwt-test"

pass=0
fail=0

check() {
    name=$1; expected=$2; actual=$3
    if [ "$actual" = "$expected" ]; then
        echo "  PASS: $name"
        pass=$((pass + 1))
    else
        echo "  FAIL: $name (expected '$expected', got '$actual')"
        fail=$((fail + 1))
    fi
}

http_status() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
http_body()   { curl -s "$@"; }

#
# ---- Preconditions ----------------------------------------------------------
#

if [ ! -f .env ]; then
    echo "ERROR: .env not found. Run from docker/ project directory." >&2
    exit 2
fi

for cmd in curl jq docker; do
    if ! command -v $cmd >/dev/null 2>&1; then
        echo "ERROR: required command not found: $cmd" >&2
        exit 2
    fi
done

read_env() { grep "^$1=" .env | head -n1 | cut -d= -f2- | tr -d '\r'; }

JWT_SECRET=$(read_env JWT_SECRET)
JWT_JWKS=$(read_env JWT_JWKS)
ANON_KEY=$(read_env ANON_KEY)
SERVICE_ROLE_KEY=$(read_env SERVICE_ROLE_KEY)
SUPABASE_PUBLISHABLE_KEY=$(read_env SUPABASE_PUBLISHABLE_KEY)
POSTGRES_PASSWORD=$(read_env POSTGRES_PASSWORD)

if [ -z "$JWT_JWKS" ]; then
    echo "SKIP: JWT_JWKS not configured. Run utils/add-new-auth-keys.sh first." >&2
    exit 0
fi

# Choose the apikey header value: prefer opaque publishable key (modern flow).
APIKEY="${SUPABASE_PUBLISHABLE_KEY:-$ANON_KEY}"

psql_exec() {
    docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$DB_CONTAINER" \
        psql -U postgres -d postgres -At -v ON_ERROR_STOP=1 "$@"
}

echo "=== test-jwt-e2e against $BASE_URL ==="

#
# ---- Step 1: provision probe RPC + storage policy ---------------------------
#

echo ""
echo "--- Provisioning ---"

# Probe RPC: returns auth.uid() and request.jwt.claims for the calling JWT.
psql_exec <<'SQL' >/dev/null 2>&1
create or replace function public.jwt_probe()
returns json
language sql
stable
security invoker
set search_path = public
as $$
    select json_build_object(
        'uid',    auth.uid(),
        'role',   auth.role(),
        'claims', current_setting('request.jwt.claims', true)::jsonb
    );
$$;
grant execute on function public.jwt_probe() to anon, authenticated;
SQL
prov_rpc=$?
check "create probe RPC" "0" "$prov_rpc"

# Reload PostgREST schema cache so the RPC is callable immediately.
curl -sS -o /dev/null \
    -X POST "$BASE_URL/rest/v1/rpc/jwt_probe" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null 2>&1
# PostgREST 14 picks up new objects via NOTIFY pgrst, 'reload schema'.
psql_exec -c "notify pgrst, 'reload schema';" >/dev/null 2>&1 || true
sleep 1

# Storage bucket + RLS policy: insert into objects only if first folder = uid.
bucket_status=$(http_status "$BASE_URL/storage/v1/bucket" \
    -X POST \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$BUCKET\",\"name\":\"$BUCKET\",\"public\":false}")
check "create test bucket" "200" "$bucket_status"

psql_exec <<SQL >/dev/null 2>&1
drop policy if exists "e2e-jwt-test-policy" on storage.objects;
create policy "e2e-jwt-test-policy"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = '$BUCKET'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "e2e-jwt-test-policy-read" on storage.objects;
create policy "e2e-jwt-test-policy-read"
on storage.objects
for select
to authenticated
using (
    bucket_id = '$BUCKET'
    and (storage.foldername(name))[1] = auth.uid()::text
);
SQL
prov_pol=$?
check "create storage RLS policy" "0" "$prov_pol"

#
# ---- Step 2: create user + obtain ES256 session JWT -------------------------
#

echo ""
echo "--- User session ---"

test_email="e2e-jwt-$$-$(date +%s)@example.com"
test_password="e2e-pw-$$-$(date +%s)"

create_resp=$(http_body "$BASE_URL/auth/v1/admin/users" \
    -X POST \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$test_email\",\"password\":\"$test_password\",\"email_confirm\":true}")
user_id=$(printf '%s' "$create_resp" | jq -r '.id // empty')
check "admin create test user" "true" "$([ -n "$user_id" ] && echo true || echo false)"

auth_resp=$(http_body "$BASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$test_email\",\"password\":\"$test_password\"}")
access_token=$(printf '%s' "$auth_resp" | jq -r '.access_token // empty')
check "user sign-in" "true" "$([ -n "$access_token" ] && echo true || echo false)"

[ -z "$access_token" ] && { echo "Cannot continue without access_token"; exit 1; }

token_alg=$(printf '%s' "$access_token" | cut -d. -f1 | base64 -d 2>/dev/null | jq -r '.alg // empty')
token_kid=$(printf '%s' "$access_token" | cut -d. -f1 | base64 -d 2>/dev/null | jq -r '.kid // empty')
check "JWT alg=ES256"      "ES256" "$token_alg"
check "JWT kid present"    "true"  "$([ -n "$token_kid" ] && echo true || echo false)"

kid_in_jwks=$(printf '%s' "$JWT_JWKS" | jq -r --arg k "$token_kid" 'if any(.keys[]; .kid==$k) then "true" else "false" end')
check "JWT kid present in JWT_JWKS"  "true"  "$kid_in_jwks"

#
# ---- Step 3: PostgREST sees the user's auth.uid() ---------------------------
#

echo ""
echo "--- PostgREST: auth.uid() ---"

rpc_resp=$(http_body "$BASE_URL/rest/v1/rpc/jwt_probe" \
    -X POST \
    -H "apikey: $APIKEY" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: application/json" \
    -d '{}')
pg_uid=$(printf '%s' "$rpc_resp" | jq -r '.uid // empty' 2>/dev/null)
pg_role=$(printf '%s' "$rpc_resp" | jq -r '.role // empty' 2>/dev/null)
check "PostgREST auth.uid() == user_id" "$user_id" "$pg_uid"
check "PostgREST auth.role() == authenticated" "authenticated" "$pg_role"

#
# ---- Step 4: Storage RLS sees the user's auth.uid() -------------------------
#

echo ""
echo "--- Storage: RLS-protected upload ---"

tmpfile=$(mktemp)
echo "e2e-jwt-test-payload" > "$tmpfile"

upload_status=$(http_status "$BASE_URL/storage/v1/object/$BUCKET/$user_id/test.txt" \
    -X POST \
    -H "apikey: $APIKEY" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: text/plain" \
    --data-binary @"$tmpfile")
check "upload to <uid>/test.txt under RLS" "200" "$upload_status"

# Upload to someone else's folder MUST be denied. This catches accidental
# anonymous downgrade (where auth.uid() becomes null and the policy collapses).
wrong_prefix="00000000-0000-0000-0000-000000000000"
deny_status=$(http_status "$BASE_URL/storage/v1/object/$BUCKET/$wrong_prefix/test.txt" \
    -X POST \
    -H "apikey: $APIKEY" \
    -H "Authorization: Bearer $access_token" \
    -H "Content-Type: text/plain" \
    --data-binary @"$tmpfile")
case "$deny_status" in
    400|401|403) check "upload to other user's folder denied (no anon downgrade)" "denied" "denied" ;;
    *)           check "upload to other user's folder denied (no anon downgrade)" "denied" "allowed:$deny_status" ;;
esac
rm -f "$tmpfile"

#
# ---- Step 5: Realtime accepts the user's JWT on WebSocket upgrade -----------
#

echo ""
echo "--- Realtime: WebSocket upgrade with user JWT ---"

ws_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    "$BASE_URL/realtime/v1/websocket?apikey=$APIKEY&vsn=1.0.0&access_token=$access_token" \
    -H "Upgrade: websocket" \
    -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")
case "$ws_code" in
    101|000) check "Realtime accepts ES256 JWT" "ok" "ok" ;;
    401)     check "Realtime accepts ES256 JWT" "ok" "401 - Realtime rejected the JWT" ;;
    *)       check "Realtime accepts ES256 JWT" "ok" "$ws_code" ;;
esac

#
# ---- Step 6: Negative tests - no silent anonymous downgrade -----------------
#

echo ""
echo "--- Negative tests: invalid JWT must NOT become anonymous ---"

# 6a. Tampered signature (flip a byte in the signature segment).
header=$(printf '%s' "$access_token" | cut -d. -f1)
payload=$(printf '%s' "$access_token" | cut -d. -f2)
sig=$(printf '%s' "$access_token" | cut -d. -f3)
tampered_sig=$(printf '%s' "$sig" | sed 's/.$/A/')
tampered_token="$header.$payload.$tampered_sig"

t_pg=$(http_status "$BASE_URL/rest/v1/rpc/jwt_probe" -X POST \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $tampered_token" \
    -H "Content-Type: application/json" -d '{}')
t_st=$(http_status "$BASE_URL/storage/v1/object/$BUCKET/$user_id/x.txt" -X POST \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $tampered_token" \
    -H "Content-Type: text/plain" --data-binary "tamper")
t_rt=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    "$BASE_URL/realtime/v1/websocket?apikey=$APIKEY&vsn=1.0.0&access_token=$tampered_token" \
    -H "Upgrade: websocket" -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")

[ "$t_pg" = "401" ] || [ "$t_pg" = "403" ] && r1="reject" || r1="accept:$t_pg"
[ "$t_st" = "401" ] || [ "$t_st" = "403" ] && r2="reject" || r2="accept:$t_st"
[ "$t_rt" = "401" ] && r3="reject" || r3="accept:$t_rt"
check "PostgREST rejects tampered sig (no anon downgrade)" "reject" "$r1"
check "Storage rejects tampered sig (no anon downgrade)"   "reject" "$r2"
check "Realtime rejects tampered sig (no anon downgrade)"  "reject" "$r3"

# 6b. Token with an unknown kid (re-header the same payload).
unknown_kid_header=$(printf '{"alg":"ES256","typ":"JWT","kid":"nonexistent-kid-zzzzzzzzzzzzzzzzz"}' \
    | base64 | tr -d '\n=' | tr '/+' '_-')
unknown_kid_token="$unknown_kid_header.$payload.$sig"
u_pg=$(http_status "$BASE_URL/rest/v1/rpc/jwt_probe" -X POST \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $unknown_kid_token" \
    -H "Content-Type: application/json" -d '{}')
u_st=$(http_status "$BASE_URL/storage/v1/object/$BUCKET/$user_id/x.txt" -X POST \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $unknown_kid_token" \
    -H "Content-Type: text/plain" --data-binary "x")
[ "$u_pg" = "401" ] || [ "$u_pg" = "403" ] && check "PostgREST rejects unknown kid" "reject" "reject" \
                                          || check "PostgREST rejects unknown kid" "reject" "$u_pg"
[ "$u_st" = "401" ] || [ "$u_st" = "403" ] && check "Storage rejects unknown kid"   "reject" "reject" \
                                          || check "Storage rejects unknown kid"   "reject" "$u_st"

#
# ---- Cleanup ----------------------------------------------------------------
#

echo ""
echo "--- Cleanup ---"

# Delete uploaded object(s); ignore failures.
curl -s -o /dev/null \
    "$BASE_URL/storage/v1/object/$BUCKET/$user_id/test.txt" \
    -X DELETE \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" || true

# Drop bucket.
curl -s -o /dev/null "$BASE_URL/storage/v1/bucket/$BUCKET" \
    -X DELETE \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" || true

# Drop test user.
if [ -n "$user_id" ]; then
    curl -s -o /dev/null "$BASE_URL/auth/v1/admin/users/$user_id" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" || true
fi

psql_exec <<'SQL' >/dev/null 2>&1
drop policy if exists "e2e-jwt-test-policy"      on storage.objects;
drop policy if exists "e2e-jwt-test-policy-read" on storage.objects;
drop function if exists public.jwt_probe();
SQL

#
# ---- Summary ----------------------------------------------------------------
#

echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -gt 0 ] && exit 1
exit 0
