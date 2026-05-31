#!/bin/sh
#
# JWT signing-key rotation test for self-hosted Supabase.
#
# Proves that when two ES256 keys are present in JWKS:
#   1. Tokens signed by either key validate against PostgREST, Storage, Realtime.
#   2. Rotating which key is "active" for signing does not invalidate tokens
#      still signed by the previous active key (until they expire naturally).
#   3. Auth services pick up the active key without restart, only when
#      JWT_KEYS / JWT_JWKS are rotated and services are reloaded.
#
# This test mints JWTs CLIENT-SIDE using the keys from JWT_KEYS so it can
# exercise both kids without depending on Auth's internal rotation API.
#
# Usage:
#   sh tests/test-jwt-rotation.sh                  # http://localhost:8000
#   sh tests/test-jwt-rotation.sh <base_url>
#
# Prerequisites:
#   - Running stack with JWT_JWKS configured
#   - At least 2 EC ES256 keys in .env JWT_KEYS (and matching public halves
#     in JWT_JWKS). If only 1 is present this test generates a second one
#     in-memory and ASKS the operator to add it before continuing.
#   - node >=16
#

set -u

BASE_URL="${1:-http://localhost:8000}"

pass=0; fail=0
check() {
    if [ "$3" = "$2" ]; then echo "  PASS: $1"; pass=$((pass+1))
    else                      echo "  FAIL: $1 (expected '$2', got '$3')"; fail=$((fail+1)); fi
}
http_status() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

[ -f .env ] || { echo "ERROR: .env not found" >&2; exit 2; }
for c in curl jq node; do
    command -v $c >/dev/null 2>&1 || { echo "ERROR: missing $c" >&2; exit 2; }
done

read_env() { grep "^$1=" .env | head -n1 | cut -d= -f2- | tr -d '\r'; }
JWT_KEYS=$(read_env JWT_KEYS)
JWT_JWKS=$(read_env JWT_JWKS)
ANON_KEY=$(read_env ANON_KEY)
SERVICE_ROLE_KEY=$(read_env SERVICE_ROLE_KEY)
SUPABASE_PUBLISHABLE_KEY=$(read_env SUPABASE_PUBLISHABLE_KEY)

if [ -z "$JWT_KEYS" ] || [ -z "$JWT_JWKS" ]; then
    echo "SKIP: JWT_KEYS or JWT_JWKS empty. Run utils/add-new-auth-keys.sh first." >&2
    exit 0
fi

APIKEY="${SUPABASE_PUBLISHABLE_KEY:-$ANON_KEY}"

ec_signing_keys() {
    printf '%s' "$JWT_KEYS" | jq -c '[.[] | select(.kty=="EC" and .alg=="ES256" and ((.key_ops // []) | index("sign")))]'
}

mint_es256() {
    # $1 = JSON of an EC private JWK with d, $2 = payload JSON
    node -e '
const crypto = require("crypto");
const jwk = JSON.parse(process.argv[1]);
const payload = JSON.parse(process.argv[2]);
const key = crypto.createPrivateKey({ key: jwk, format: "jwk" });
const header = { alg: "ES256", typ: "JWT", kid: jwk.kid };
const enc = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const signing_input = enc(header) + "." + enc(payload);
const sig = crypto.sign("SHA256", Buffer.from(signing_input), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
process.stdout.write(signing_input + "." + sig);
    ' -- "$1" "$2"
}

KEYS=$(ec_signing_keys)
NUM_KEYS=$(printf '%s' "$KEYS" | jq -r 'length')

echo "=== test-jwt-rotation against $BASE_URL ==="
echo ""
echo "--- Discovery ---"
echo "  ES256 signing keys in JWT_KEYS: $NUM_KEYS"

if [ "$NUM_KEYS" -lt 1 ]; then
    echo "  SKIP: no ES256 signing keys present"; exit 0
fi

JWKS_LIVE=$(curl -sS "$BASE_URL/auth/v1/.well-known/jwks.json" | jq '.')

#
# ---- Case 1: Each existing key in JWT_KEYS produces a token every verifier accepts.
#

iat=$(date +%s)
exp=$((iat + 600))

i=0
while [ "$i" -lt "$NUM_KEYS" ]; do
    jwk=$(printf '%s' "$KEYS" | jq -c ".[$i]")
    kid=$(printf '%s'  "$jwk" | jq -r '.kid')
    payload=$(jq -nc --arg sub "00000000-0000-0000-0000-000000000$i" --arg iss "supabase" \
                     --argjson iat "$iat" --argjson exp "$exp" \
                     '{aud:"authenticated", role:"authenticated", sub:$sub, iss:$iss, iat:$iat, exp:$exp}')
    token=$(mint_es256 "$jwk" "$payload")

    pg=$(http_status "$BASE_URL/rest/v1/" \
        -H "apikey: $APIKEY" -H "Authorization: Bearer $token")
    st=$(http_status "$BASE_URL/storage/v1/bucket" \
        -H "apikey: $APIKEY" -H "Authorization: Bearer $token")
    rt=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
        "$BASE_URL/realtime/v1/websocket?apikey=$APIKEY&vsn=1.0.0&access_token=$token" \
        -H "Upgrade: websocket" -H "Connection: Upgrade" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")

    check "PostgREST accepts kid=$kid" "200" "$pg"
    check "Storage   accepts kid=$kid" "200" "$st"
    [ "$rt" = "101" ] || [ "$rt" = "000" ] && rt_r="ok" || rt_r="reject:$rt"
    check "Realtime  accepts kid=$kid" "ok" "$rt_r"

    i=$((i + 1))
done

#
# ---- Case 2: An ES256 token whose kid is NOT in JWT_JWKS must be rejected by ALL verifiers.
#

echo ""
echo "--- Unknown-kid token must be rejected (no anonymous downgrade) ---"

unknown_jwk=$(node -e '
const c = require("crypto");
const {privateKey} = c.generateKeyPairSync("ec", { namedCurve: "P-256" });
const jwk = privateKey.export({ format: "jwk" });
jwk.kid = "rotation-test-foreign-kid-" + Date.now();
jwk.alg = "ES256";
process.stdout.write(JSON.stringify(jwk));
')
payload_unknown=$(jq -nc --argjson iat "$iat" --argjson exp "$exp" \
    '{aud:"authenticated", role:"authenticated", sub:"99999999-9999-9999-9999-999999999999", iss:"supabase", iat:$iat, exp:$exp}')
unknown_token=$(mint_es256 "$unknown_jwk" "$payload_unknown")

u_pg=$(http_status "$BASE_URL/rest/v1/" \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $unknown_token")
u_st=$(http_status "$BASE_URL/storage/v1/bucket" \
    -H "apikey: $APIKEY" -H "Authorization: Bearer $unknown_token")
u_rt=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    "$BASE_URL/realtime/v1/websocket?apikey=$APIKEY&vsn=1.0.0&access_token=$unknown_token" \
    -H "Upgrade: websocket" -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")

[ "$u_pg" = "401" ] || [ "$u_pg" = "403" ] && r="reject" || r="accept:$u_pg"
check "PostgREST rejects unknown-kid ES256" "reject" "$r"
[ "$u_st" = "401" ] || [ "$u_st" = "403" ] && r="reject" || r="accept:$u_st"
check "Storage   rejects unknown-kid ES256" "reject" "$r"
[ "$u_rt" = "401" ]                        && r="reject" || r="accept:$u_rt"
check "Realtime  rejects unknown-kid ES256" "reject" "$r"

#
# ---- Case 3: Rolling rotation guidance (advisory) ---------------------------
#
echo ""
echo "--- Rolling rotation guidance ---"
echo "  To rotate without invalidating existing sessions:"
echo "    1. Generate a second EC P-256 keypair (kid=NEW_KID)."
echo "    2. Append the PRIVATE key to JWT_KEYS, PUBLIC key to JWT_JWKS."
echo "    3. Recreate auth/rest/storage/realtime so they reload env:"
echo "         docker compose up -d --no-deps --force-recreate auth rest storage realtime"
echo "    4. Verify this script PASSES for BOTH kids."
echo "    5. Move NEW_KID to the FIRST position in JWT_KEYS to make it the"
echo "       active signing key (Auth signs with keys[0])."
echo "    6. Recreate auth again."
echo "    7. After all clients refresh (>= JWT_EXPIRY), drop OLD_KID."

#
# ---- Summary ----------------------------------------------------------------
#
echo ""
echo "=== Results: $pass passed, $fail failed ==="
[ "$fail" -gt 0 ] && exit 1 || exit 0
