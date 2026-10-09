#!/bin/sh
# Custom entrypoint for Kong that builds Lua expressions for request-transformer
# and performs environment variable substitution in the declarative config.

# Build Lua expressions for translating opaque API keys to asymmetric JWTs.
# When opaque keys are not configured (empty env vars), expressions fall through
# to legacy-only behavior - just passing apikey as-is.
#
# Full expression logic (when opaque keys are configured):
#   1. If Authorization header exists and is NOT an sb_ key -> pass through (user session JWT)
#   2. If apikey matches secret key -> set service_role asymmetric JWT internal "API key"
#   3. If apikey matches publishable key -> set anon asymmetric JWT internal "API key"
#   4. Fallback: pass apikey as-is (legacy HS256 JWT)

if [ -n "$SUPABASE_SECRET_KEY" ] && [ -n "$SUPABASE_PUBLISHABLE_KEY" ]; then
    # Opaque keys configured -> full translation expressions
    export LUA_AUTH_EXPR="\$((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and headers.authorization) or (headers.apikey == '$SUPABASE_SECRET_KEY' and 'Bearer $SERVICE_ROLE_KEY_ASYMMETRIC') or (headers.apikey == '$SUPABASE_PUBLISHABLE_KEY' and 'Bearer $ANON_KEY_ASYMMETRIC') or headers.apikey)"

    # Realtime WebSocket: reads from query_params.apikey (supabase-js sends apikey
    # via query string), outputs to x-api-key header which Realtime checks first.
    export LUA_RT_WS_EXPR="\$((query_params.apikey == '$SUPABASE_SECRET_KEY' and '$SERVICE_ROLE_KEY_ASYMMETRIC') or (query_params.apikey == '$SUPABASE_PUBLISHABLE_KEY' and '$ANON_KEY_ASYMMETRIC') or query_params.apikey)"

    # Functions: translate opaque sb_ keys to the pre-signed internal asymmetric
    # JWT and emit it as a raw `sb-api-key` header (no Bearer prefix), leaving
    # Authorization untouched. The key is read from the apikey header or an
    # Authorization `Bearer sb_...` fallback (header only, matching platform
    # behavior. On no match the expression yields nil (rendered as an empty
    # header) which the route's post-function then strips.
    export LUA_FUNCTIONS_EXPR="\$((headers.apikey == '$SUPABASE_SECRET_KEY' and '$SERVICE_ROLE_KEY_ASYMMETRIC') or (headers.apikey == '$SUPABASE_PUBLISHABLE_KEY' and '$ANON_KEY_ASYMMETRIC') or (headers.authorization == 'Bearer $SUPABASE_SECRET_KEY' and '$SERVICE_ROLE_KEY_ASYMMETRIC') or (headers.authorization == 'Bearer $SUPABASE_PUBLISHABLE_KEY' and '$ANON_KEY_ASYMMETRIC') or nil)"
else
    # Legacy API keys, not sb_ API keys -> pass apikey through unchanged
    export LUA_AUTH_EXPR="\$((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and headers.authorization) or headers.apikey)"
    export LUA_RT_WS_EXPR="\$(query_params.apikey)"

    # Functions: no opaque keys configured -> never set sb-api-key (the empty
    # value is stripped by the route's post-function).
    export LUA_FUNCTIONS_EXPR="\$(nil)"
fi

# Build the OAuth 2.0 Authorization Server Metadata route path from JWT_ISSUER
# (RFC 8414 section 3.1: the well-known segment is inserted between host and path)
WELL_KNOWN_OAUTH_PATH="/.well-known/oauth-authorization-server"
if [ -n "$JWT_ISSUER" ]; then
  ISSUER="$JWT_ISSUER"

  # RFC 8414: remove any terminating "/" before inserting the well-known segment
  while [ "${ISSUER%/}" != "$ISSUER" ]; do
    ISSUER="${ISSUER%/}"
  done

  case "$ISSUER" in
  http://* | https://*) ;;
  *)
    echo "ERROR: JWT_ISSUER must start with http:// or https:// (got: $JWT_ISSUER)"
    exit 1
    ;;
  esac

  REST="${ISSUER#*://}"
  case "$REST" in
  */*) WELL_KNOWN_OAUTH_PATH="/.well-known/oauth-authorization-server/${REST#*/}" ;;
  esac
fi
export WELL_KNOWN_OAUTH_PATH

# Substitute environment variables in the Kong declarative config.
# Uses awk instead of eval/echo to preserve YAML quoting (eval strips double
# quotes, breaking "Header: value" patterns that YAML parses as mappings).
awk '{
  result = ""
  rest = $0
  while (match(rest, /\$[A-Za-z_][A-Za-z_0-9]*/)) {
    varname = substr(rest, RSTART + 1, RLENGTH - 1)
    if (varname in ENVIRON) {
      result = result substr(rest, 1, RSTART - 1) ENVIRON[varname]
    } else {
      result = result substr(rest, 1, RSTART + RLENGTH - 1)
    }
    rest = substr(rest, RSTART + RLENGTH)
  }
  print result rest
}' /home/kong/temp.yml > "$KONG_DECLARATIVE_CONFIG"

# Remove empty key-auth credentials (unconfigured opaque keys)
sed -i '/^[[:space:]]*- key:[[:space:]]*$/d' "$KONG_DECLARATIVE_CONFIG"

exec /entrypoint.sh kong docker-start
