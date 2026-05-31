#!/bin/sh
#
# Operator runtime diagnostic for ES256 JWT verifier consistency across all
# self-hosted Supabase services that validate user JWTs (Auth, PostgREST,
# Storage, Realtime, Edge Functions).
#
# Use this to PROVE at runtime whether JWKS is wired correctly to every
# verifier, and to capture before/after evidence around a fix or migration.
#
# Usage:
#   sh diagnose-jwt.sh                       # Run all diagnostics, print to stdout
#   sh diagnose-jwt.sh > evidence.txt        # Capture to a file
#   sh diagnose-jwt.sh --base-url <url>      # Custom Kong URL (default http://localhost:8000)
#   sh diagnose-jwt.sh --json                # Machine-readable JSON output (for CI)
#
# Exit codes:
#   0 = all verifiers consistent (or HS256-only and consistent)
#   1 = inconsistency detected (e.g. one service on JWKS, another on HS256-only)
#   2 = preconditions failed (.env missing, docker missing, stack not running)
#
# Requires: curl, jq, docker. Does NOT require node.
#
# This script is read-only; it does not modify .env, docker-compose.yml, or any
# container state. It is safe to run against production.
#

set -u

BASE_URL="http://localhost:8000"
OUT_JSON=0

while [ $# -gt 0 ]; do
    case "$1" in
        --base-url) BASE_URL="$2"; shift 2 ;;
        --json) OUT_JSON=1; shift ;;
        -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 2 ;;
    esac
done

#
# ---- Preconditions -----------------------------------------------------------
#

for cmd in curl jq docker; do
    if ! command -v $cmd >/dev/null 2>&1; then
        echo "ERROR: required command not found: $cmd" >&2
        exit 2
    fi
done

if [ ! -f .env ]; then
    echo "ERROR: .env not found. Run from the docker/ project directory." >&2
    exit 2
fi

read_env() { grep "^$1=" .env | head -n1 | cut -d= -f2- | tr -d '\r'; }

JWT_SECRET=$(read_env JWT_SECRET)
JWT_KEYS=$(read_env JWT_KEYS)
JWT_JWKS=$(read_env JWT_JWKS)
ANON_KEY=$(read_env ANON_KEY)
SERVICE_ROLE_KEY=$(read_env SERVICE_ROLE_KEY)
SUPABASE_PUBLISHABLE_KEY=$(read_env SUPABASE_PUBLISHABLE_KEY)

#
# ---- Helpers -----------------------------------------------------------------
#

# Findings are accumulated in two parallel arrays via files (POSIX-sh friendly).
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
: > "$TMP/findings"
: > "$TMP/failures"

section() { echo ""; echo "=== $* ==="; }
note()    { echo "  $*"; }
finding() {
    # $1=key, $2=value, $3=severity(info|warn|fail)
    printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$TMP/findings"
    if [ "$3" = "fail" ]; then printf '%s: %s\n' "$1" "$2" >> "$TMP/failures"; fi
}

# Run docker inspect; tolerate "container not found".
container_running() {
    docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null
}

# Pull a sanitized snapshot of JWT-related env vars from a container.
container_jwt_env() {
    docker exec "$1" sh -c 'env' 2>/dev/null \
        | grep -E '^(GOTRUE_JWT|PGRST_JWT|API_JWT|AUTH_JWT|JWT_)' \
        | sort \
        | awk -F= '{
            v=$2;
            # Truncate long JWKS/keys values: keep first 24 chars + indication.
            if (length(v) > 48) v=substr(v,1,24) "...(" length($2) " chars)";
            print $1 "=" v
          }'
}

# Base64url-decode a string ($1).
b64url_decode() {
    printf '%s' "$1" | tr '_-' '/+' | awk '{ l=length($0)%4; if (l) printf "%s%s", $0, substr("====",1,4-l); else print $0 }' | base64 -d 2>/dev/null
}

# Decode JWT header.
jwt_header() { b64url_decode "$(printf '%s' "$1" | cut -d. -f1)"; }

#
# ---- Step 1: .env asymmetric-key state --------------------------------------
#

section "Step 1: .env asymmetric-key configuration"

if [ -n "$JWT_KEYS" ]; then
    keys_count=$(printf '%s' "$JWT_KEYS" | jq -r 'length' 2>/dev/null || echo "0")
    finding "env.JWT_KEYS"     "$keys_count keys" "info"
    note "JWT_KEYS: $keys_count keys present (used by Auth to sign new tokens)"
else
    finding "env.JWT_KEYS"     "absent" "info"
    note "JWT_KEYS not set (Auth will sign HS256 only)"
fi

if [ -n "$JWT_JWKS" ]; then
    jwks_count=$(printf '%s' "$JWT_JWKS" | jq -r '.keys | length' 2>/dev/null || echo "0")
    jwks_kids=$(printf '%s' "$JWT_JWKS" | jq -r '[.keys[] | .kid // "(no-kid)"] | join(",")' 2>/dev/null)
    jwks_has_es256=$(printf '%s' "$JWT_JWKS" | jq -r 'if any(.keys[]; .kty=="EC" and .alg=="ES256") then "true" else "false" end' 2>/dev/null)
    finding "env.JWT_JWKS"             "$jwks_count keys (kids=$jwks_kids)" "info"
    finding "env.JWT_JWKS.has_es256"   "$jwks_has_es256"                    "info"
    note "JWT_JWKS: $jwks_count keys (kids=$jwks_kids), has_es256=$jwks_has_es256"
else
    finding "env.JWT_JWKS" "absent" "warn"
    note "JWT_JWKS not set (verifiers fall back to HS256-only)"
fi

if [ -n "$SUPABASE_PUBLISHABLE_KEY" ] && [ -z "$JWT_JWKS" ]; then
    finding "config.consistency.api_keys" \
            "opaque sb_publishable_ key present but JWT_JWKS empty - asymmetric API keys cannot be verified" \
            "fail"
fi

#
# ---- Step 2: Per-container JWT env wiring -----------------------------------
#

section "Step 2: Per-container JWT verifier wiring"

# Service name (used in compose) -> container_name.
SERVICES="auth:supabase-auth rest:supabase-rest realtime:realtime-dev.supabase-realtime storage:supabase-storage functions:supabase-edge-functions"

for entry in $SERVICES; do
    svc=$(printf '%s' "$entry" | cut -d: -f1)
    cn=$(printf '%s'  "$entry" | cut -d: -f2)
    state=$(container_running "$cn")
    if [ "$state" != "true" ]; then
        finding "container.$svc.state" "not running" "warn"
        note "[$svc] container '$cn' is not running; skipping env probe"
        continue
    fi
    finding "container.$svc.state" "running" "info"
    echo ""
    note "[$svc] $cn JWT env:"
    container_jwt_env "$cn" | sed 's/^/    /'
    if [ "$svc" = "realtime" ] || [ "$svc" = "storage" ]; then
        # Mode classification: JWKS-active vs HS256-only vs misconfigured.
        env_dump=$(docker exec "$cn" sh -c 'env' 2>/dev/null)
        has_jwks=$(printf '%s' "$env_dump" | grep -E '^(API_JWT_JWKS|JWT_JWKS)=' | grep -vE '=\s*\{?"?keys"?:?\s*\[\s*\]?\}?\s*$' | head -n1)
        if [ -n "$has_jwks" ]; then
            finding "container.$svc.verifier_mode" "JWKS (asymmetric)" "info"
        else
            finding "container.$svc.verifier_mode" "HS256-only (no usable JWKS env)" "warn"
        fi
    fi
done

#
# ---- Step 3: Live JWKS endpoint ---------------------------------------------
#

section "Step 3: Auth /.well-known/jwks.json endpoint"

jwks_url="$BASE_URL/auth/v1/.well-known/jwks.json"
jwks_body=$(curl -sS "$jwks_url" 2>/dev/null)
jwks_status=$(curl -sS -o /dev/null -w '%{http_code}' "$jwks_url" 2>/dev/null)
note "GET $jwks_url -> HTTP $jwks_status"
if [ "$jwks_status" = "200" ] && [ -n "$jwks_body" ]; then
    live_kids=$(printf '%s' "$jwks_body" | jq -r '[.keys[] | .kid // "(no-kid)"] | join(",")' 2>/dev/null)
    live_algs=$(printf '%s' "$jwks_body" | jq -r '[.keys[] | .alg // .kty] | unique | join(",")' 2>/dev/null)
    finding "auth.jwks.kids" "$live_kids" "info"
    finding "auth.jwks.algs" "$live_algs" "info"
    note "Live JWKS kids=$live_kids algs=$live_algs"

    # Cross-check live JWKS vs env JWT_JWKS.
    if [ -n "$JWT_JWKS" ]; then
        env_kids=$(printf '%s'  "$JWT_JWKS" | jq -r '[.keys[] | .kid // empty] | sort | join(",")' 2>/dev/null)
        live_kids_sorted=$(printf '%s' "$jwks_body" | jq -r '[.keys[] | .kid // empty] | sort | join(",")' 2>/dev/null)
        if [ "$env_kids" != "$live_kids_sorted" ]; then
            finding "consistency.env_vs_live_jwks" \
                    "env JWT_JWKS kids ($env_kids) differ from /auth/v1/.well-known/jwks.json ($live_kids_sorted)" \
                    "fail"
        else
            finding "consistency.env_vs_live_jwks" "match" "info"
        fi
    fi
else
    finding "auth.jwks.endpoint" "unavailable (HTTP $jwks_status)" "fail"
fi

#
# ---- Step 4: Sign a live test token and probe each service ------------------
#

section "Step 4: Live ES256 verification probe per service"

if [ -z "$ANON_KEY" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    finding "probe.preconditions" "ANON_KEY or SERVICE_ROLE_KEY missing in .env" "warn"
    note "Skipping live-probe section."
else
    # Create a short-lived test user, sign in to get a real session token.
    test_email="diag-jwt-$$-$(date +%s)@example.com"
    test_password="diag-pw-$$-$(date +%s)"
    create_resp=$(curl -sS "$BASE_URL/auth/v1/admin/users" \
        -X POST \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"password\":\"$test_password\",\"email_confirm\":true}" 2>/dev/null)
    test_user_id=$(printf '%s' "$create_resp" | jq -r '.id // empty' 2>/dev/null)

    auth_resp=$(curl -sS "$BASE_URL/auth/v1/token?grant_type=password" \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$test_email\",\"password\":\"$test_password\"}" 2>/dev/null)
    access_token=$(printf '%s' "$auth_resp" | jq -r '.access_token // empty' 2>/dev/null)

    if [ -z "$access_token" ]; then
        finding "probe.signin" "failed to obtain a session token" "fail"
        note "Sign-in response: $(printf '%s' "$auth_resp" | head -c 200)"
    else
        hdr=$(jwt_header "$access_token")
        token_alg=$(printf '%s' "$hdr" | jq -r '.alg // empty' 2>/dev/null)
        token_kid=$(printf '%s' "$hdr" | jq -r '.kid // empty' 2>/dev/null)
        finding "probe.token.alg" "$token_alg" "info"
        finding "probe.token.kid" "$token_kid" "info"
        note "Issued session token alg=$token_alg kid=$token_kid"

        if [ "$token_alg" = "ES256" ] && [ -n "$JWT_JWKS" ]; then
            kid_in_env=$(printf '%s' "$JWT_JWKS" | jq -r --arg k "$token_kid" 'if any(.keys[]; .kid==$k) then "true" else "false" end')
            [ "$kid_in_env" = "true" ] && finding "probe.token.kid_in_env_jwks" "match" "info" \
                                       || finding "probe.token.kid_in_env_jwks" "NOT in env JWT_JWKS - verifiers will fail" "fail"
        fi

        probe_one() {
            label=$1; url=$2
            code=$(curl -sS -o /dev/null -w '%{http_code}' "$url" \
                -H "apikey: ${SUPABASE_PUBLISHABLE_KEY:-$ANON_KEY}" \
                -H "Authorization: Bearer $access_token" 2>/dev/null)
            note "[$label] $url -> HTTP $code"
            if [ "$code" = "200" ] || [ "$code" = "204" ]; then
                finding "probe.$label" "$code" "info"
            else
                finding "probe.$label" "HTTP $code (expected 200/204)" "fail"
            fi
        }

        probe_one "postgrest" "$BASE_URL/rest/v1/"
        probe_one "storage"   "$BASE_URL/storage/v1/bucket"

        # Realtime: WebSocket upgrade. 101 = success, 401 = verifier rejected.
        ws_code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 2 \
            "$BASE_URL/realtime/v1/websocket?apikey=${SUPABASE_PUBLISHABLE_KEY:-$ANON_KEY}&vsn=1.0.0&access_token=$access_token" \
            -H "Upgrade: websocket" \
            -H "Connection: Upgrade" \
            -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
            -H "Sec-WebSocket-Version: 13" 2>/dev/null || echo "000")
        note "[realtime] websocket upgrade -> HTTP $ws_code (101 or 000 = ok, 401 = verifier reject)"
        case "$ws_code" in
            101|000) finding "probe.realtime_ws" "$ws_code" "info" ;;
            401)     finding "probe.realtime_ws" "401 (Realtime rejected the user JWT)" "fail" ;;
            *)       finding "probe.realtime_ws" "$ws_code" "warn" ;;
        esac

        # Cleanup test user.
        if [ -n "$test_user_id" ]; then
            curl -sS -o /dev/null "$BASE_URL/auth/v1/admin/users/$test_user_id" \
                -X DELETE \
                -H "apikey: $SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SERVICE_ROLE_KEY"
        fi
    fi
fi

#
# ---- Step 5: Summary --------------------------------------------------------
#

section "Summary"

fail_count=$(wc -l < "$TMP/failures" 2>/dev/null | tr -d ' ')
fail_count=${fail_count:-0}

if [ "$OUT_JSON" = "1" ]; then
    awk -F'\t' '{printf "{\"key\":\"%s\",\"value\":\"%s\",\"severity\":\"%s\"}\n", $1, $2, $3}' "$TMP/findings" \
        | jq -s --argjson failed "$fail_count" '{failed: $failed, findings: .}' \
        || cat "$TMP/findings"
else
    awk -F'\t' '{printf "  [%-4s] %-40s %s\n", $3, $1, $2}' "$TMP/findings"
fi

echo ""
if [ "$fail_count" -gt 0 ]; then
    echo "RESULT: $fail_count failing finding(s)."
    echo ""
    echo "  Failures:"
    sed 's/^/    /' "$TMP/failures"
    exit 1
fi

echo "RESULT: all verifiers consistent."
exit 0
