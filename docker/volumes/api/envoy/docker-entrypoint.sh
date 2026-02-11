#!/bin/sh
set -e

# Generate base64 encoded basic auth credentials for dashboard
# Format: username:password -> base64
DASHBOARD_BASIC_AUTH=$(printf '%s' "${DASHBOARD_USERNAME}:${DASHBOARD_PASSWORD}" | base64 | tr -d '\n')

echo "Generating Envoy configuration..."

# Process the lds.yaml template with environment variables using sed
# Using | as delimiter since JWT tokens contain /
sed -e "s|\${ANON_KEY}|${ANON_KEY}|g" \
    -e "s|\${SERVICE_ROLE_KEY}|${SERVICE_ROLE_KEY}|g" \
    -e "s|\${DASHBOARD_BASIC_AUTH}|${DASHBOARD_BASIC_AUTH}|g" \
    /etc/envoy/lds.yaml.template > /etc/envoy/lds.yaml

echo "Envoy configuration generated successfully"
echo "Starting Envoy..."

# Start Envoy
exec envoy -c /etc/envoy/envoy.yaml "$@"
