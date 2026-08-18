#!/bin/sh
set -e

# Generate SHA1 base64 hash for Envoy basic auth user list
PASSWORD_HASH=$(printf '%s' "${DASHBOARD_PASSWORD}" | openssl sha1 -binary | openssl base64)
DASHBOARD_BASIC_AUTH="${DASHBOARD_USERNAME}:{SHA}${PASSWORD_HASH}"

# Reduce a URL to a browser-style Origin (scheme://host[:port]) so it can be
# matched exactly against the Origin header: strips any path/query/fragment
# and trailing slash, and drops the port when it's the scheme's default.
normalize_origin() {
  url="$1"
  [ -z "$url" ] && return
  scheme="${url%%://*}"
  rest="${url#*://}"
  authority="${rest%%/*}"
  origin="${scheme}://${authority}"
  case "$origin" in
    http://*:80) origin="${origin%:80}" ;;
    https://*:443) origin="${origin%:443}" ;;
  esac
  printf '%s' "$origin"
}

SUPABASE_PUBLIC_ORIGIN=$(normalize_origin "$SUPABASE_PUBLIC_URL")

echo "Generating Envoy configuration..."

# Process the lds.yaml template with environment variables using sed
# Using | as delimiter since JWT tokens contain /
sed -e "s|\${ANON_KEY}|${ANON_KEY}|g" \
    -e "s|\${ANON_KEY_ASYMMETRIC}|${ANON_KEY_ASYMMETRIC}|g" \
    -e "s|\${SERVICE_ROLE_KEY}|${SERVICE_ROLE_KEY}|g" \
    -e "s|\${SERVICE_ROLE_KEY_ASYMMETRIC}|${SERVICE_ROLE_KEY_ASYMMETRIC}|g" \
    -e "s|\${SUPABASE_PUBLISHABLE_KEY}|${SUPABASE_PUBLISHABLE_KEY}|g" \
    -e "s|\${SUPABASE_SECRET_KEY}|${SUPABASE_SECRET_KEY}|g" \
    -e "s|\${SUPABASE_PUBLIC_URL}|${SUPABASE_PUBLIC_ORIGIN}|g" \
    -e "s|\${DASHBOARD_BASIC_AUTH}|${DASHBOARD_BASIC_AUTH}|g" \
    /etc/envoy/lds.template.yaml > /etc/envoy/lds.yaml

if [ -n "$SUPABASE_SECRET_KEY" ] && \
   [ -n "$SUPABASE_PUBLISHABLE_KEY" ] && \
   [ -n "$SERVICE_ROLE_KEY_ASYMMETRIC" ] && \
   [ -n "$ANON_KEY_ASYMMETRIC" ]; then
  echo "Envoy sb_ key translation enabled"
else
  echo "Envoy running in legacy API key mode (sb_ keys disabled)"
fi

echo "Envoy configuration generated successfully"
echo "Starting Envoy..."

# Start Envoy
exec envoy -c /etc/envoy/envoy.yaml "$@"
