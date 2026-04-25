#!/bin/sh
#
# Verify all self-hosted Supabase services started correctly by checking log output.
#
# Usage:
#   sh test-container-logs.sh
#
# Prerequisites:
#   - Running self-hosted Supabase instance (docker compose up)
#

set -e

pass=0
fail=0

fail_msg() {
    fail=$((fail + 1))
    echo "  FAIL: $1"
}

pass_msg() {
    pass=$((pass + 1))
    echo "  PASS: $1"
}

# Check that a service's logs contain all expected patterns
check_logs() {
    service="$1"
    shift

    logs=$(docker compose logs "$service" 2>/dev/null)
    if [ -z "$logs" ]; then
        fail_msg "$service (no logs found)"
        return
    fi

    for pattern in "$@"; do
        if ! echo "$logs" | grep -q -i -E "$pattern"; then
            fail_msg "$service (missing: $pattern)"
            return
        fi
    done

    pass_msg "$service"
}

echo ""
echo "=== Checking service startup logs ==="
echo ""

check_logs db \
    'PostgreSQL init process complete; ready for start up.|Skipping initialization'

check_logs auth \
    'db worker started'

check_logs kong \
    'init.lua.*declarative config loaded'

check_logs rest \
    'Schema cache loaded in.*milliseconds'

check_logs realtime \
    'Starting Realtime' \
    'Connected to Postgres database' \
    'Janitor started' \
    'Starting MetricsCleaner'

check_logs storage \
    'Started Successfully'

check_logs studio \
    'ready in.*s$'

check_logs meta \
    'Server listening at http'

check_logs functions \
    'main function started'

check_logs analytics \
    'Access LogflareWeb.Endpoint at http://localhost:4000' \
    'Executing startup tasks' \
    'Ensuring single tenant user is seeded'

check_logs supavisor \
    'Connected to Postgres database' \
    'HEAD /api/health$'

check_logs vector \
    'Vector has started'

check_logs imgproxy \
    'Starting server at :5001'

echo ""
echo "=== Results: $pass passed, $fail failed ==="
echo ""

if [ "$fail" -gt 0 ]; then
    echo "Inspect logs: docker compose logs <service>"
    echo ""
    exit 1
fi
