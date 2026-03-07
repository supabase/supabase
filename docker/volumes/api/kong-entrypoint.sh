#!/bin/bash
# Custom entrypoint for Kong that builds Lua expressions for request-transformer
# and performs environment variable substitution in the declarative config.

# Build Lua expression for translating opaque API keys to asymmetric JWTs.
# When asymmetric keys are not configured (empty env vars), the expression
# falls through to headers.apikey — preserving legacy behavior.
#
# Logic:
#   1. If Authorization header exists and is NOT an sb_ key → pass through (user session JWT)
#   2. If apikey matches secret key → set service_role asymmetric JWT
#   3. If apikey matches publishable key → set anon asymmetric JWT
#   4. Fallback: pass apikey as-is (legacy JWT)

export LUA_AUTH_EXPR="\$((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and headers.authorization) or (headers.apikey == '$SUPABASE_SECRET_KEY' and 'Bearer $SERVICE_ROLE_KEY_ASYMMETRIC') or (headers.apikey == '$SUPABASE_PUBLISHABLE_KEY' and 'Bearer $ANON_KEY_ASYMMETRIC') or headers.apikey)"

# Realtime WebSocket: sets x-api-key header instead of Authorization.
# When a user session JWT is present in Authorization, returns empty string
# so x-api-key is not added — Realtime falls back to apikey query param.
# (Kong's request-transformer skips adding headers with empty values.)
export LUA_RT_WS_EXPR="\$((headers.authorization ~= nil and headers.authorization:sub(1, 10) ~= 'Bearer sb_' and '') or (headers.apikey == '$SUPABASE_SECRET_KEY' and '$SERVICE_ROLE_KEY_ASYMMETRIC') or (headers.apikey == '$SUPABASE_PUBLISHABLE_KEY' and '$ANON_KEY_ASYMMETRIC') or headers.apikey)"

# Substitute environment variables in the Kong declarative config
# https://unix.stackexchange.com/a/294837
eval "echo \"$(cat /home/kong/temp.yml)\"" > /home/kong/kong.yml

exec /docker-entrypoint.sh kong docker-start
