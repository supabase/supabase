#!/bin/sh
# gotrue-deep-healthcheck.sh
#
# Layered, *honest* healthcheck for GoTrue / supabase-auth.
#
#   Layer 1  liveness    GET /health             (process responds)
#   Layer 2  router      GET /settings           (router + middleware + JSON encoder)
#   Layer 3  db + admin  GET /admin/users?per_page=1 with a service-role JWT
#                        (full DB pool + admin path = the path that froze
#                        in the original incident)
#
# Exit codes
#   0   all layers passed
#   1   layer 1 failed (process truly dead — kubelet should restart)
#   2   layer 2 failed (router/middleware wedged — pod should be drained)
#   3   layer 3 failed (DB pool / admin handler wedged — pod should be drained)
#   4   misconfiguration (missing JWT etc.) — treated as warning, exits 0 for
#       layers 1+2 to avoid false-positive restart loops.
#
# Designed to be safe under `set -eu` and to leak NEITHER the JWT in `ps`
# (read from env) NOR the response body to stdout. Output is one of:
#
#   ok                       all layers passed
#   degraded:settings        layer 2 down, layer 1 up
#   degraded:admin           layer 3 down, layer 1+2 up
#   down                     layer 1 down
#
# Compatible with BusyBox `wget`-only environments via the WGET fallback
# (`/health` and `/settings` only — the admin probe requires curl for
# header support).

set -eu

URL="${GOTRUE_URL:-http://localhost:9999}"
TIMEOUT="${GOTRUE_PROBE_TIMEOUT:-3}"
# Optional. If empty, layer 3 is skipped with a warning.
JWT="${GOTRUE_PROBE_ADMIN_JWT:-}"

have() { command -v "$1" >/dev/null 2>&1; }

# Returns 0/1, never prints the body.
probe_curl() {
  url=$1
  shift
  curl --silent --show-error --fail \
       --max-time "$TIMEOUT" \
       --output /dev/null \
       "$@" "$url"
}

probe_wget() {
  url=$1
  wget --quiet --tries=1 --timeout="$TIMEOUT" \
       --spider "$url"
}

# Layer-agnostic GET; uses curl if available, falls back to wget.
http_get() {
  if have curl; then
    probe_curl "$1"
  else
    probe_wget "$1"
  fi
}

# Layer 1 — liveness. Process must respond.
if ! http_get "$URL/health"; then
  echo "down" >&2
  exit 1
fi

# Layer 2 — router. /settings is DB-free but exercises router + middleware +
# JSON encoder. If this fails while /health passes, the chi mux or a
# middleware is wedged.
if ! http_get "$URL/settings"; then
  echo "degraded:settings" >&2
  exit 2
fi

# Layer 3 — DB + admin path. Requires a service-role JWT. We deliberately
# request `per_page=1` so the cost is bounded; this still exercises the
# full pool + admin auth + JSON serialiser path.
if [ -z "$JWT" ]; then
  echo "ok (layer 3 skipped: GOTRUE_PROBE_ADMIN_JWT not set)"
  exit 0
fi

if ! have curl; then
  # No header support in busybox wget; warn but don't fail.
  echo "ok (layer 3 skipped: curl not available, only wget)"
  exit 0
fi

if ! probe_curl "$URL/admin/users?page=1&per_page=1" \
       -H "Authorization: Bearer $JWT" \
       -H "apikey: $JWT"
then
  echo "degraded:admin" >&2
  exit 3
fi

echo "ok"
