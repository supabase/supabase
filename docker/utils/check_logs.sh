#!/bin/sh

set -e

checks_failed=0
logs_failed_for=""

fail_msg() {
    checks_failed=$((checks_failed + 1))
    if [ -z "$logs_failed_for" ]; then
        logs_failed_for="$1"
    else
        logs_failed_for="${logs_failed_for}, $1"
    fi
    echo "failed."
}

echo ""
echo "Checking Docker Compose logs for service startup confirmation..."
echo ""

echo "===> Checking storage..."
docker compose logs storage | grep -q -i 'Started Successfully' || fail_msg storage

echo "===> Checking studio..."
docker compose logs studio | grep -q -i 'ready in.*s$' || fail_msg studio

echo "===> Checking meta..."
docker compose logs meta | grep -q -i 'Server listening at http' || fail_msg meta

echo "===> Checking realtime..."
docker compose logs realtime | grep -q -i 'Starting Realtime' && \
docker compose logs realtime | grep -q -i 'Connected to Postgres database' && \
docker compose logs realtime | grep -q -i -m 1 'HEAD /api/tenants/realtime-dev/health$' || fail_msg realtime

echo "===> Checking supavisor..."
docker compose logs supavisor | grep -q -i 'Connected to Postgres database' && \
docker compose logs supavisor | grep -q -i 'HEAD /api/health$' || fail_msg supavisor

echo "===> Checking functions..."
docker compose logs functions | grep -q -i 'main function started' || fail_msg functions

echo "===> Checking auth..."
docker compose logs auth | grep -q -i 'db worker started' || fail_msg auth

echo "===> Checking kong..."
docker compose logs kong | grep -q -i 'init.lua.*declarative config loaded' || fail_msg kong

echo "===> Checking rest..."
docker compose logs rest | grep -q -i 'Schema cache loaded in.*milliseconds' || fail_msg rest

echo "===> Checking analytics..."
docker compose logs analytics | grep -q -i 'Access LogflareWeb.Endpoint at http://localhost:4000' && \
docker compose logs analytics | grep -q -i -m 1 'All logs logged!' || fail_msg analytics

echo "===> Checking postgres..."
docker compose logs db | grep -q -i -E 'PostgreSQL init process complete; ready for start up.|Skipping initialization' || fail_msg db

echo "===> Checking vector..."
docker compose logs vector | grep -q -i 'Vector has started' || fail_msg vector

echo "===> Checking imgproxy..."
docker compose logs imgproxy | grep -q -i 'Starting server at :5001' && \
docker compose logs imgproxy | grep -q -i -m 1 'Completed.*/health' || fail_msg imgproxy

echo ""

if [ $checks_failed -gt 0 ]; then
    echo "Failed checks: $checks_failed"
    echo "Checks failed for: $logs_failed_for"
    echo "Inspect Docker Compose logs for these containers to see what's wrong."
    echo ""
    exit 1
else
    echo "All checks passed!"
fi

echo ""
