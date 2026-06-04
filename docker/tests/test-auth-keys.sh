#!/bin/sh
#
# Test API key types and asymmetric auth against a running self-hosted instance.
#
# Usage:
#   sh test-auth-keys.sh              # Uses http://localhost:8000
#   sh test-auth-keys.sh <base_url>   # Custom URL
#
# Prerequisites:
#   - Running self-hosted Supabase instance
#   - .env file with all keys configured
#   - jq (for JSON parsing)
#   - node >= 16 (for HS256 token minting test only)
#

set -e

BASE_URL="${1:-http://localhost:8000}"

if [ ! -f .env ]; then
    echo "Error: .env file not found. Run from the project directory."
    exit 1
fi

for cmd in jq node; do
    if ! command -v $cmd >/dev/null 2>&1; then
        echo "Error: $cmd not found."
        exit 1
    fi
done

# Read keys from .env
JWT_SECRET=$(grep '^JWT_SECRET=' .env | cut -d= -f2-)
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2-)
SERVICE_ROLE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
SUPABASE_PUBLISHABLE_KEY=$(grep '^SUPABASE_PUBLISHABLE_KEY=' .env | cut -d= -f2-)
SUPABASE_SECRET_KEY=$(grep '^SUPABASE_SECRET_KEY=' .env | cut -d= -f2-)

pass=0
fail=0

check() {
    test_name="$1"
    expected="$2"
    actual="$3"

    if [ "$actual" = "$expected" ]; then
        echo "  PASS: $test_name (HTTP $actual)"
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

echo ""
echo "=== Testing against $BASE_URL ==="
echo ""

# ---------------------------------------------
# 1. Route tests with API key types
# ---------------------------------------------

echo "--- REST API (/rest/v1/) ---"
check "Legacy ANON_KEY" "200" \
    "$(http_status "$BASE_URL/rest/v1/" -H "apikey: $ANON_KEY")"
check "Legacy SERVICE_ROLE_KEY" "200" \
    "$(http_status "$BASE_URL/rest/v1/" -H "apikey: $SERVICE_ROLE_KEY")"

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    check "New PUBLISHABLE_KEY" "200" \
        "$(http_status "$BASE_URL/rest/v1/" -H "apikey: $SUPABASE_PUBLISHABLE_KEY")"
    check "New SECRET_KEY" "200" \
        "$(http_status "$BASE_URL/rest/v1/" -H "apikey: $SUPABASE_SECRET_KEY")"
else
    echo "  SKIP: Opaque keys not configured"
fi

check "No key -> 401" "401" \
    "$(http_status "$BASE_URL/rest/v1/")"
check "Invalid key -> 401" "401" \
    "$(http_status "$BASE_URL/rest/v1/" -H "apikey: invalid-key")"

echo ""
echo "--- Auth (/auth/v1/settings) ---"
check "Legacy ANON_KEY" "200" \
    "$(http_status "$BASE_URL/auth/v1/settings" -H "apikey: $ANON_KEY")"

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    check "New PUBLISHABLE_KEY" "200" \
        "$(http_status "$BASE_URL/auth/v1/settings" -H "apikey: $SUPABASE_PUBLISHABLE_KEY")"
fi

check "No key -> 401" "401" \
    "$(http_status "$BASE_URL/auth/v1/settings")"

echo ""
echo "--- Storage (/storage/v1/bucket) ---"
# Storage has no key-auth - passes through, Storage returns its own errors
check "No key -> not 401 (Storage handles auth)" "true" \
    "$([ "$(http_status "$BASE_URL/storage/v1/bucket")" != "401" ] && echo true || echo false)"
check "Legacy ANON_KEY" "200" \
    "$(http_status "$BASE_URL/storage/v1/bucket" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY")"

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    # With opaque key, Kong translates to asymmetric JWT in Authorization
    check "New PUBLISHABLE_KEY" "200" \
        "$(http_status "$BASE_URL/storage/v1/bucket" -H "apikey: $SUPABASE_PUBLISHABLE_KEY")"
fi

echo ""
echo "--- Storage S3 (/storage/v1/s3/) ---"
# S3 uses AWS SigV4 auth (not apikey) - the request-transformer Lua expression
# passes the Authorization header through unchanged for non-sb_ values
check "S3 route accessible" "true" \
    "$([ "$(http_status "$BASE_URL/storage/v1/s3/")" != "502" ] && echo true || echo false)"

echo ""
echo "--- GraphQL (/graphql/v1) ---"
check "Legacy ANON_KEY" "200" \
    "$(http_status "$BASE_URL/graphql/v1" \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __typename }"}')"

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    check "New PUBLISHABLE_KEY" "200" \
        "$(http_status "$BASE_URL/graphql/v1" \
            -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
            -H "Content-Type: application/json" \
            -d '{"query":"{ __typename }"}')"
fi

check "No key -> 401" "401" \
    "$(http_status "$BASE_URL/graphql/v1" \
        -H "Content-Type: application/json" \
        -d '{"query":"{ __typename }"}')"

echo ""
echo "--- Realtime REST (/realtime/v1/api/) ---"
# Realtime REST API - expect 200 or other non-401 response with valid key
check "Legacy ANON_KEY -> not 401" "true" \
    "$([ "$(http_status "$BASE_URL/realtime/v1/api/tenants" -H "apikey: $ANON_KEY")" != "401" ] && echo true || echo false)"

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    check "New PUBLISHABLE_KEY -> not 401" "true" \
        "$([ "$(http_status "$BASE_URL/realtime/v1/api/tenants" -H "apikey: $SUPABASE_PUBLISHABLE_KEY")" != "401" ] && echo true || echo false)"
fi

check "No key -> 401" "401" \
    "$(http_status "$BASE_URL/realtime/v1/api/tenants")"

echo ""
echo "--- supabase-js style requests (apikey + Authorization) ---"
# supabase-js sends both apikey header AND Authorization: Bearer <apikey>
if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    check "apikey + Authorization: Bearer sb_ (replace path)" "200" \
        "$(http_status "$BASE_URL/rest/v1/" \
            -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
            -H "Authorization: Bearer $SUPABASE_PUBLISHABLE_KEY")"
fi

check "Legacy apikey + Authorization: Bearer <legacy jwt>" "200" \
    "$(http_status "$BASE_URL/rest/v1/" \
        -H "apikey: $ANON_KEY" \
        -H "Authorization: Bearer $ANON_KEY")"

echo ""
echo "--- Edge cases ---"
# Opaque key in Authorization only (no apikey header) - should be rejected by key-auth
if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    check "sb_ in Authorization only (no apikey) -> 401" "401" \
        "$(http_status "$BASE_URL/rest/v1/" \
            -H "Authorization: Bearer $SUPABASE_PUBLISHABLE_KEY")"
fi

echo ""
echo "--- JWKS endpoint ---"
check "JWKS public endpoint (no auth)" "200" \
    "$(http_status "$BASE_URL/auth/v1/.well-known/jwks.json")"

# Verify JWKS content: should have EC key, should NOT have symmetric key
jwks_content=$(curl -s "$BASE_URL/auth/v1/.well-known/jwks.json")
jwks_has_ec=$(echo "$jwks_content" | jq -r '[.keys[] | .kty] | if any(. == "EC") then "true" else "false" end' 2>/dev/null)
jwks_has_oct=$(echo "$jwks_content" | jq -r '[.keys[] | .kty] | if any(. == "oct") then "true" else "false" end' 2>/dev/null)
check "JWKS contains EC public key" "true" "$jwks_has_ec"
check "JWKS does NOT contain symmetric key" "false" "$jwks_has_oct"

#echo ""
#echo "--- OAuth metadata endpoint ---"
#check "well-known oauth (no auth)" "200" \
#    "$(http_status "$BASE_URL/.well-known/oauth-authorization-server")"

echo ""
echo "--- Realtime WebSocket upgrade ---"
# Test that WebSocket upgrade request gets through (expect 101 or non-401)
# curl --max-time to prevent hanging on successful upgrade (101 keeps connection open)
ws_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 \
    "$BASE_URL/realtime/v1/websocket?apikey=$ANON_KEY&vsn=1.0.0" \
    -H "Upgrade: websocket" \
    -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")
# 101 = upgrade success, 000 = timeout (connection stayed open = success)
check "WebSocket upgrade with legacy key -> not 401" "true" \
    "$([ "$ws_status" != "401" ] && echo true || echo false)"

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    ws_status_new=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 \
        "$BASE_URL/realtime/v1/websocket?apikey=$SUPABASE_PUBLISHABLE_KEY&vsn=1.0.0" \
        -H "Upgrade: websocket" \
        -H "Connection: Upgrade" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")
    check "WebSocket upgrade with opaque key -> not 401" "true" \
        "$([ "$ws_status_new" != "401" ] && echo true || echo false)"
fi

# ---------------------------------------------
# 2. User session JWT tests
# ---------------------------------------------

echo ""
echo "--- User session JWT ---"

# Create user via admin API (works regardless of email autoconfirm setting)
test_email="test-keys-$$@example.com"
test_password="test-password-123456"

create_resp=$(curl -s "$BASE_URL/auth/v1/admin/users" \
    -X POST \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$test_email\",\"password\":\"$test_password\",\"email_confirm\":true}")

test_user_id=$(echo "$create_resp" | jq -r '.id // empty' 2>/dev/null)

# Sign in to get session JWT
auth_response=$(curl -s "$BASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$test_email\",\"password\":\"$test_password\"}")

access_token=$(echo "$auth_response" | jq -r '.access_token // empty' 2>/dev/null)

if [ -n "$access_token" ]; then
    # Check the algorithm in the JWT header
    jwt_alg=$(echo "$access_token" | cut -d. -f1 | \
        jq -Rr '@base64d | fromjson | .alg // empty' 2>/dev/null)

    if [ -n "$jwt_alg" ]; then
        echo "  INFO: User session JWT signed with: $jwt_alg"
        if [ "$jwt_alg" = "ES256" ]; then
            check "JWT uses ES256 (asymmetric)" "ES256" "$jwt_alg"
        else
            check "JWT uses HS256 (legacy)" "HS256" "$jwt_alg"
        fi
    fi

    # Use the session JWT with PostgREST
    check "Session JWT with PostgREST" "200" \
        "$(http_status "$BASE_URL/rest/v1/" \
            -H "apikey: $ANON_KEY" \
            -H "Authorization: Bearer $access_token")"

    # Use the session JWT with Storage
    check "Session JWT with Storage" "200" \
        "$(http_status "$BASE_URL/storage/v1/bucket" \
            -H "apikey: $ANON_KEY" \
            -H "Authorization: Bearer $access_token")"

    # CRITICAL: Authenticated user + opaque key (most common supabase-js flow)
    # supabase-js sends apikey: sb_publishable_xxx AND Authorization: Bearer <user_session_jwt>
    # The expression MUST keep the user JWT and NOT replace it with the anon asymmetric JWT
    if [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
        echo ""
        echo "--- Authenticated user + opaque key (critical path) ---"
        check "Opaque apikey + user JWT -> PostgREST uses user JWT" "200" \
            "$(http_status "$BASE_URL/rest/v1/" \
                -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
                -H "Authorization: Bearer $access_token")"
        check "Opaque apikey + user JWT -> Storage uses user JWT" "200" \
            "$(http_status "$BASE_URL/storage/v1/bucket" \
                -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
                -H "Authorization: Bearer $access_token")"
        check "Opaque apikey + user JWT -> Auth uses user JWT" "200" \
            "$(http_status "$BASE_URL/auth/v1/user" \
                -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
                -H "Authorization: Bearer $access_token")"
    fi
else
    check "Sign in test user" "true" "false"
fi

# Clean up test user
if [ -n "$test_user_id" ]; then
    curl -s -o /dev/null "$BASE_URL/auth/v1/admin/users/$test_user_id" \
        -X DELETE \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY"
fi

# ---------------------------------------------
# 3. HS256 backward compatibility
# ---------------------------------------------

echo ""
echo "--- HS256 backward compatibility ---"

# Mint a legacy HS256 JWT with role=anon (simulating a pre-migration token)
hs256_token=$(JWT_SECRET="$JWT_SECRET" node -e "
const crypto = require('crypto');
const header = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
const payload = Buffer.from(JSON.stringify({
    role:'anon',iss:'supabase',
    iat:Math.floor(Date.now()/1000),
    exp:Math.floor(Date.now()/1000)+3600
})).toString('base64url');
const sig = crypto.createHmac('sha256',process.env.JWT_SECRET)
    .update(header+'.'+payload).digest('base64url');
console.log(header+'.'+payload+'.'+sig);
" 2>/dev/null)

if [ -n "$hs256_token" ]; then
    check "HS256 token with PostgREST (backward compat)" "200" \
        "$(http_status "$BASE_URL/rest/v1/" \
            -H "apikey: $ANON_KEY" \
            -H "Authorization: Bearer $hs256_token")"
else
    echo "  SKIP: Could not mint HS256 token (node required)"
fi

# ---------------------------------------------
# 4. JWT_KEYS format validation
# ---------------------------------------------

echo ""
echo "--- JWT_KEYS format ---"

JWT_KEYS_VAL=$(grep '^JWT_KEYS=' .env | cut -d= -f2-)
if [ -n "$JWT_KEYS_VAL" ]; then
    # Auth expects a JSON array, not a JWKS object
    jwt_keys_is_array=$(echo "$JWT_KEYS_VAL" | jq -r 'if type == "array" then "true" else "false" end' 2>/dev/null)
    check "JWT_KEYS is JSON array (not JWKS object)" "true" "$jwt_keys_is_array"

    jwt_keys_has_sign=$(echo "$JWT_KEYS_VAL" | jq -r 'if any(.[]; .key_ops and (.key_ops | index("sign"))) then "true" else "false" end' 2>/dev/null)
    check "JWT_KEYS has a signing key (key_ops: sign)" "true" "$jwt_keys_has_sign"
else
    echo "  SKIP: JWT_KEYS not configured"
fi

# ---------------------------------------------
# Summary
# ---------------------------------------------

echo ""
echo "=== Results: $pass passed, $fail failed ==="
echo ""

if [ "$fail" -gt 0 ]; then
    exit 1
fi
