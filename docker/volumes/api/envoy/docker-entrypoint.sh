#!/bin/sh
set -e

# Generate SHA1 base64 hash for Envoy basic auth user list
PASSWORD_HASH=$(printf '%s' "${DASHBOARD_PASSWORD}" | openssl sha1 -binary | openssl base64)
DASHBOARD_BASIC_AUTH="${DASHBOARD_USERNAME}:{SHA}${PASSWORD_HASH}"

# Build the OAuth 2.0 Authorization Server Metadata route path from JWT_ISSUER
# (RFC 8414 section 3.1: the well-known segment is inserted between host and path)
WELL_KNOWN_OAUTH_PATH="/.well-known/oauth-authorization-server"
if [ -n "$JWT_ISSUER" ]; then
  ISSUER="$JWT_ISSUER"

  while [ "${ISSUER%/}" != "$ISSUER" ]; do
    ISSUER="${ISSUER%/}"
  done

  case "$ISSUER" in
    http://*|https://*) ;;
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

echo "Generating Envoy configuration..."

# Process the lds.yaml template with environment variables using sed
# Using | as delimiter since JWT tokens contain /
sed -e "s|\${ANON_KEY}|${ANON_KEY}|g" \
    -e "s|\${ANON_KEY_ASYMMETRIC}|${ANON_KEY_ASYMMETRIC}|g" \
    -e "s|\${SERVICE_ROLE_KEY}|${SERVICE_ROLE_KEY}|g" \
    -e "s|\${SERVICE_ROLE_KEY_ASYMMETRIC}|${SERVICE_ROLE_KEY_ASYMMETRIC}|g" \
    -e "s|\${SUPABASE_PUBLISHABLE_KEY}|${SUPABASE_PUBLISHABLE_KEY}|g" \
    -e "s|\${SUPABASE_SECRET_KEY}|${SUPABASE_SECRET_KEY}|g" \
    -e "s|\${SUPABASE_PUBLIC_URL}|${SUPABASE_PUBLIC_URL}|g" \
    -e "s|\${DASHBOARD_BASIC_AUTH}|${DASHBOARD_BASIC_AUTH}|g" \
    -e "s|\${WELL_KNOWN_OAUTH_PATH}|${WELL_KNOWN_OAUTH_PATH}|g" \
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
