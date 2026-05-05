#!/bin/sh
#
# Manage the self-hosted Supabase docker compose stack.
#
# Reads CONFIG from .env (space-separated list of override names) to decide
# which docker-compose.<name>.yml override files to layer on top of the base
# docker-compose.yml.
#
# Examples in .env:
#   CONFIG=                  (no overrides, default)
#   CONFIG=pg17              (one override)
#   CONFIG="pg17 envoy"      (multiple, quote when there are spaces)
#
# Usage:
#   ./run.sh start            # docker compose up -d --wait
#   ./run.sh stop             # docker compose down
#   ./run.sh restart          # stop then start
#   ./run.sh status           # docker compose ps
#   ./run.sh logs [service]   # follow logs (all or one service)
#   ./run.sh pull             # pull images
#   ./run.sh config           # print resolved CONFIG and compose files
#   ./run.sh secrets          # print key passwords and API keys from .env
#

set -e

cd "$(dirname "$0")"

if [ ! -f docker-compose.yml ]; then
    echo "ERROR: docker-compose.yml not found in $(pwd)" >&2
    exit 1
fi

CONFIG=""
if [ -f .env ]; then
    CONFIG=$(grep '^CONFIG=' .env | head -n1 | cut -d= -f2- | tr -d "\r\"'")
fi

COMPOSE_FILES="-f docker-compose.yml"
for name in $CONFIG; do
    file="docker-compose.${name}.yml"
    if [ ! -f "$file" ]; then
        echo "ERROR: $file (from CONFIG=$CONFIG) not found in $(pwd)" >&2
        exit 1
    fi
    COMPOSE_FILES="$COMPOSE_FILES -f $file"
done

CMD="${1:-help}"
[ "$#" -gt 0 ] && shift

# COMPOSE_FILES is intentionally word-split; each token is a separate -f / path.
case "$CMD" in
    start|up)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES up -d --wait "$@"
        ;;
    stop|down)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES down "$@"
        ;;
    restart)
        # shellcheck disable=SC2086
        docker compose $COMPOSE_FILES restart
        ;;
    recreate)
        # shellcheck disable=SC2086
        docker compose $COMPOSE_FILES down
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES up -d --wait
        ;;
    status|ps)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES ps "$@"
        ;;
    logs)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES logs -f "$@"
        ;;
    pull)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES pull "$@"
        ;;
    config)
        echo "CONFIG=$CONFIG"
        echo "compose files: $COMPOSE_FILES"
        echo ""
        ;;
    secrets)
        if [ ! -f .env ]; then
            echo "ERROR: .env not found in $(pwd)" >&2
            exit 1
        fi
        for var in POSTGRES_PASSWORD DASHBOARD_PASSWORD \
                   SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY \
                   S3_PROTOCOL_ACCESS_KEY_ID S3_PROTOCOL_ACCESS_KEY_SECRET; do
            line=$(grep "^${var}=" .env | head -n1)
            if [ -n "$line" ]; then
                echo "$line"
            else
                echo "${var}="
            fi
        done
        echo ""
        ;;
    help|-h|--help)
        cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  start              Start the stack (docker compose up -d --wait)
  stop               Stop the stack (docker compose down)
  restart            Restart the stack (docker compose restart)
  recreate           Stop then start (docker compose down && docker compose up -d --wait)
  status             Show service status
  logs [service]     Follow logs (optionally for a single service)
  pull               Pull all images
  config             Show resolved CONFIG and compose files
  secrets            Show key passwords and API keys from .env

EOF
        ;;
    *)
        echo "Unknown command: $CMD" >&2
        echo "Run '$0 help' for usage." >&2
        exit 1
        ;;
esac
