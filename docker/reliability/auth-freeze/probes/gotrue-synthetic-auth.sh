#!/bin/sh
# gotrue-synthetic-auth.sh
#
# End-to-end synthetic authentication probe.
#
# Walks the same code path real users walk:
#
#   1. POST /signup                                          (writes auth.users + audit log)
#   2. POST /token?grant_type=password                       (bcrypt + sessions + refresh_tokens)
#   3. POST /token?grant_type=refresh_token                  (refresh path)
#   4. POST /admin/users/{id}/factors  (no-op DELETE)        (admin path)
#   5. DELETE /admin/users/{id}                              (cleanup)
#
# If any step exceeds GOTRUE_SYNTH_TIMEOUT_SECS (default 10s) total, exits
# non-zero with a structured one-line summary. Designed to be invoked from
# CI, from a Kubernetes CronJob, or from an alerting pipeline.
#
# Required env:
#   GOTRUE_URL                  default http://localhost:9999
#   GOTRUE_SYNTH_ADMIN_JWT      service-role JWT (REQUIRED)
#   GOTRUE_SYNTH_EMAIL_DOMAIN   default reliability.example.test
#
# Optional:
#   GOTRUE_SYNTH_TIMEOUT_SECS   total budget (default 10)
#
# Output format (one line, stable for log parsers):
#
#   synthetic_auth status=ok    duration_ms=812   signup=143 login=487 refresh=82 admin=51 cleanup=49
#   synthetic_auth status=fail  step=login         duration_ms=10004 err="timeout after 10s"
#
# Exit codes
#   0   pass
#   1   fail (any step)
#   2   misconfiguration

set -eu

URL="${GOTRUE_URL:-http://localhost:9999}"
JWT="${GOTRUE_SYNTH_ADMIN_JWT:-}"
DOMAIN="${GOTRUE_SYNTH_EMAIL_DOMAIN:-reliability.example.test}"
BUDGET="${GOTRUE_SYNTH_TIMEOUT_SECS:-10}"

if [ -z "$JWT" ]; then
  echo "synthetic_auth status=misconfigured err=\"GOTRUE_SYNTH_ADMIN_JWT not set\""
  exit 2
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "synthetic_auth status=misconfigured err=\"curl required\""
  exit 2
fi

# Per-step timeout = budget / 5 steps, minimum 2 s.
PER_STEP=$(( BUDGET / 5 ))
if [ "$PER_STEP" -lt 2 ]; then PER_STEP=2; fi

# Generate a unique email + 32-char password. Avoids /dev/urandom-only deps
# by using $$, time, and `od` if available.
rand_hex() {
  if [ -r /dev/urandom ]; then
    od -An -tx1 -N16 /dev/urandom 2>/dev/null | tr -d ' \n'
  else
    printf '%s%s%s' "$$" "$(date +%s%N 2>/dev/null || date +%s)" "$(awk 'BEGIN{srand(); print int(rand()*1e9)}')"
  fi
}

RID=$(rand_hex)
EMAIL="probe-${RID}@${DOMAIN}"
PASSWORD="P-${RID}!"

now_ms() {
  # POSIX-portable millisecond clock. GNU date supports %N, BSD/macOS doesn't.
  if d=$(date +%s%N 2>/dev/null) && [ "${d#*N}" = "$d" ]; then
    echo $(( d / 1000000 ))
  else
    # Fall back to second resolution.
    echo $(( $(date +%s) * 1000 ))
  fi
}

START=$(now_ms)
ERR_STEP=""
ERR_MSG=""

# Returns the response body via stdout, http code via stderr-by-reference.
# We use --write-out to capture the code without polluting the body.
req() {
  method=$1; path=$2; body=${3:-}; extra=${4:-}
  if [ -n "$body" ]; then
    curl --silent --show-error \
         --max-time "$PER_STEP" \
         --connect-timeout "$PER_STEP" \
         --request "$method" \
         --header "Content-Type: application/json" \
         --header "Authorization: Bearer $JWT" \
         --header "apikey: $JWT" \
         --data-raw "$body" \
         --write-out '\n__HTTP_CODE__=%{http_code}\n' \
         "$URL$path" $extra
  else
    curl --silent --show-error \
         --max-time "$PER_STEP" \
         --connect-timeout "$PER_STEP" \
         --request "$method" \
         --header "Authorization: Bearer $JWT" \
         --header "apikey: $JWT" \
         --write-out '\n__HTTP_CODE__=%{http_code}\n' \
         "$URL$path" $extra
  fi
}

extract_code() {
  printf '%s\n' "$1" | awk -F= '/^__HTTP_CODE__=/{print $2}'
}

extract_body() {
  printf '%s\n' "$1" | awk '/^__HTTP_CODE__=/{exit} {print}'
}

# Crude JSON field extraction without jq (jq is not always present in
# minimal probe images). Picks the first occurrence of "field":"value".
json_str() {
  field=$1
  awk -v f="\"$field\":" '
    {
      n = index($0, f)
      if (n == 0) next
      rest = substr($0, n + length(f))
      sub(/^[[:space:]]*"/, "", rest)
      q = index(rest, "\"")
      if (q == 0) next
      print substr(rest, 1, q - 1)
      exit
    }
  '
}

step_signup() {
  T0=$(now_ms)
  out=$(req POST /signup "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" || true)
  code=$(extract_code "$out")
  if [ "$code" != "200" ] && [ "$code" != "201" ]; then
    ERR_STEP=signup
    ERR_MSG="http $code"
    return 1
  fi
  body=$(extract_body "$out")
  USER_ID=$(printf '%s' "$body" | json_str "id")
  if [ -z "${USER_ID:-}" ]; then
    ERR_STEP=signup
    ERR_MSG="no user id in response"
    return 1
  fi
  T_SIGNUP=$(( $(now_ms) - T0 ))
}

step_login() {
  T0=$(now_ms)
  out=$(req POST "/token?grant_type=password" \
        "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" || true)
  code=$(extract_code "$out")
  if [ "$code" != "200" ]; then
    ERR_STEP=login
    ERR_MSG="http $code"
    return 1
  fi
  body=$(extract_body "$out")
  REFRESH=$(printf '%s' "$body" | json_str "refresh_token")
  if [ -z "${REFRESH:-}" ]; then
    ERR_STEP=login; ERR_MSG="no refresh_token"; return 1
  fi
  T_LOGIN=$(( $(now_ms) - T0 ))
}

step_refresh() {
  T0=$(now_ms)
  out=$(req POST "/token?grant_type=refresh_token" \
        "{\"refresh_token\":\"$REFRESH\"}" || true)
  code=$(extract_code "$out")
  if [ "$code" != "200" ]; then
    ERR_STEP=refresh; ERR_MSG="http $code"; return 1
  fi
  T_REFRESH=$(( $(now_ms) - T0 ))
}

step_admin() {
  T0=$(now_ms)
  out=$(req GET "/admin/users/$USER_ID" || true)
  code=$(extract_code "$out")
  if [ "$code" != "200" ]; then
    ERR_STEP=admin; ERR_MSG="http $code"; return 1
  fi
  T_ADMIN=$(( $(now_ms) - T0 ))
}

step_cleanup() {
  T0=$(now_ms)
  out=$(req DELETE "/admin/users/$USER_ID" || true)
  code=$(extract_code "$out")
  if [ "$code" != "200" ] && [ "$code" != "204" ]; then
    ERR_STEP=cleanup; ERR_MSG="http $code"; return 1
  fi
  T_CLEANUP=$(( $(now_ms) - T0 ))
}

T_SIGNUP=0; T_LOGIN=0; T_REFRESH=0; T_ADMIN=0; T_CLEANUP=0

if step_signup && step_login && step_refresh && step_admin && step_cleanup; then
  END=$(now_ms)
  printf 'synthetic_auth status=ok duration_ms=%d signup=%d login=%d refresh=%d admin=%d cleanup=%d\n' \
    $(( END - START )) "$T_SIGNUP" "$T_LOGIN" "$T_REFRESH" "$T_ADMIN" "$T_CLEANUP"
  exit 0
else
  END=$(now_ms)
  printf 'synthetic_auth status=fail step=%s duration_ms=%d err="%s"\n' \
    "$ERR_STEP" $(( END - START )) "$ERR_MSG"
  # Best-effort cleanup if we got far enough.
  if [ -n "${USER_ID:-}" ]; then
    req DELETE "/admin/users/$USER_ID" >/dev/null 2>&1 || true
  fi
  exit 1
fi
