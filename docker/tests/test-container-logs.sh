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
project_name="${COMPOSE_PROJECT_NAME:-supabase}"

fail_msg() {
    fail=$((fail + 1))
    echo "  FAIL: $1"
}

pass_msg() {
    pass=$((pass + 1))
    echo "  PASS: $1"
}

# The `docker ps` fallback in the helpers below exists because the script
# doesn't know which compose `-f` flags the user ran `up` with. `docker compose
# ps` only sees services defined in the currently loaded compose files, but
# compose stamps `com.docker.compose.{project,service}` labels at `up` time -
# so a label-based lookup finds the container regardless of which override
# files are active in this shell.

is_service_running() {
    service="$1"
    if docker compose ps --services --status running 2>/dev/null | grep -q "^$service$"; then
        return 0
    fi

    docker ps --filter "label=com.docker.compose.project=$project_name" \
        --filter "label=com.docker.compose.service=$service" \
        --filter "status=running" \
        --quiet | grep -q '.'
}

get_container_id() {
    service="$1"

    container_id=$(docker compose ps -q "$service" 2>/dev/null || true)
    if [ -n "$container_id" ]; then
        printf '%s' "$container_id"
        return
    fi

    container_id=$(docker ps -a \
        --filter "label=com.docker.compose.project=$project_name" \
        --filter "label=com.docker.compose.service=$service" \
        --quiet)

    set -- $container_id
    printf '%s' "$1"
}

# Check that a service's logs contain all expected patterns
check_logs() {
    service="$1"
    shift

    logs=$(docker compose logs "$service" 2>/dev/null || true)
    if [ -z "$logs" ]; then
        container_id=$(get_container_id "$service")
        if [ -n "$container_id" ]; then
            logs=$(docker logs "$container_id" 2>&1 || true)
        fi
    fi

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

check_logs_if_running() {
    service="$1"
    shift

    if is_service_running "$service"; then
        check_logs "$service" "$@"
    else
        pass_msg "$service (skipped: service not running)"
    fi
}

echo ""
echo "=== Checking service startup logs ==="
echo ""

check_logs db \
    'PostgreSQL init process complete; ready for start up.|Skipping initialization'

check_logs auth \
    'db worker started'

check_logs_if_running kong \
    'init.lua.*declarative config loaded'

check_logs_if_running api-gw \
     'Envoy configuration generated successfully' \
     'Starting Envoy...'

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

check_logs_if_running analytics \
    'Access LogflareWeb.Endpoint at http://localhost:4000' \
    'Executing startup tasks' \
    'Ensuring single tenant user is seeded'

check_logs supavisor \
    'Connected to Postgres database' \
    'HEAD /api/health$'

check_logs_if_running vector \
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
