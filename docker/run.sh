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
#   ./run.sh start                  # docker compose -f ... up -d --wait
#   ./run.sh stop                   # docker compose -f ... down
#   ./run.sh restart [service]      # restart the stack (or named services)
#   ./run.sh restart --except <svc>...  # restart all services except the named ones
#   ./run.sh recreate [service]     # stop then start (or force-recreate one service)
#   ./run.sh recreate --except <svc>...  # force-recreate all services except the named ones
#   ./run.sh status                 # docker compose ps
#   ./run.sh logs [service]         # follow logs (all or one service)
#   ./run.sh inspect <service>      # docker inspect on a service's container
#   ./run.sh printenv <service>     # print a service's environment variables
#   ./run.sh pull                   # pull images
#   ./run.sh config                 # print CONFIG list of the compose files
#   ./run.sh config add <name>      # add overrides to CONFIG in .env
#   ./run.sh config remove <name>   # remove overrides from CONFIG in .env
#   ./run.sh compose-config         # dump fully-resolved docker compose config
#   ./run.sh secrets                # print key passwords and API keys from .env
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

print_config() {
    cfg="$1"
    files="-f docker-compose.yml"
    for n in $cfg; do
        files="$files -f docker-compose.${n}.yml"
    done
    echo "CONFIG=$cfg"
    echo "compose files: $files"
    echo ""
}

# Echoes the list of services (one per line) minus those passed as args.
# Warns on unknown names; returns 1 if no services remain.
services_except() {
    # shellcheck disable=SC2086
    all_services=$(docker compose $COMPOSE_FILES config --services)
    filtered="$all_services"
    for ex in "$@"; do
        echo "$all_services" | grep -qFx "$ex" \
            || echo "Warning: '$ex' is not a service in this project" >&2
        filtered=$(echo "$filtered" | grep -vFx "$ex" || true)
    done
    if [ -z "$filtered" ]; then
        echo "No services left after applying --except" >&2
        return 1
    fi
    printf '%s\n' "$filtered"
}

write_env_config() {
    new_value="$1"
    if [ ! -f .env ]; then
        echo "ERROR: .env not found in $(pwd)" >&2
        exit 1
    fi
    if [ -n "$new_value" ]; then
        new_line="CONFIG=\"$new_value\""
    else
        new_line="CONFIG="
    fi
    if grep -q '^CONFIG=' .env; then
        sed -i.old -e "s|^CONFIG=.*$|$new_line|" .env
        rm -f .env.old
    else
        cat >> .env <<EOF

############
# List of docker-compose override files to layer on top of docker-compose.yml.
# Each name should match a docker-compose.<name>.yml file. Used by ./run.sh
#
# Examples:
#   CONFIG=                 (no overrides, default)
#   CONFIG="pg17 envoy"     (quote when there are spaces)
#
############
$new_line
EOF
    fi
}

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
        if [ "${1:-}" = "--except" ]; then
            shift
            [ $# -eq 0 ] && { echo "Usage: $(basename "$0") restart --except <svc>..." >&2; exit 1; }
            services=$(services_except "$@") || exit 1
            # shellcheck disable=SC2086
            exec docker compose $COMPOSE_FILES restart $services
        fi
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES restart "$@"
        ;;
    recreate)
        if [ "${1:-}" = "--except" ]; then
            shift
            [ $# -eq 0 ] && { echo "Usage: $(basename "$0") recreate --except <svc>..." >&2; exit 1; }
            services=$(services_except "$@") || exit 1
            # shellcheck disable=SC2086
            exec docker compose $COMPOSE_FILES up -d --wait --force-recreate --no-deps $services
        fi
        if [ $# -eq 0 ]; then
            # shellcheck disable=SC2086
            docker compose $COMPOSE_FILES down
            # shellcheck disable=SC2086
            exec docker compose $COMPOSE_FILES up -d --wait
        fi
        # Single-service recreate: force-recreate the named services only,
        # leave their dependencies running.
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES up -d --wait --force-recreate --no-deps "$@"
        ;;
    status|ps)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES ps "$@"
        ;;
    logs)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES logs -f "$@"
        ;;
    inspect)
        [ $# -eq 0 ] && { echo "Usage: $(basename "$0") inspect <service> [docker-inspect-args]" >&2; exit 1; }
        svc="$1"; shift
        # shellcheck disable=SC2086
        cid=$(docker compose $COMPOSE_FILES ps -q "$svc")
        [ -z "$cid" ] && { echo "Service '$svc' is not running" >&2; exit 1; }
        exec docker inspect "$cid" "$@"
        ;;
    printenv)
        [ $# -eq 0 ] && { echo "Usage: $(basename "$0") printenv <service>" >&2; exit 1; }
        svc="$1"
        # shellcheck disable=SC2086
        cid=$(docker compose $COMPOSE_FILES ps -q "$svc")
        [ -z "$cid" ] && { echo "Service '$svc' is not running" >&2; exit 1; }
        exec docker inspect --format='{{range .Config.Env}}{{println .}}{{end}}' "$cid"
        ;;
    pull)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES pull "$@"
        ;;
    compose-config)
        # shellcheck disable=SC2086
        exec docker compose $COMPOSE_FILES config "$@"
        ;;
    config)
        sub="${1:-show}"
        [ "$#" -gt 0 ] && shift
        case "$sub" in
            show)
                print_config "$CONFIG"
                ;;
            add)
                [ $# -eq 0 ] && { echo "Usage: $(basename "$0") config add <name>..." >&2; exit 1; }
                new_config="$CONFIG"
                for n in "$@"; do
                    if [ ! -f "docker-compose.${n}.yml" ]; then
                        echo "ERROR: docker-compose.${n}.yml not found" >&2
                        exit 1
                    fi
                    # Pad with spaces so " $n " matches whole words only (not substrings of other names)
                    case " $new_config " in
                        *" $n "*) echo "Already present: $n" ;;
                        *)        new_config="${new_config:+$new_config }$n" ;;
                    esac
                done
                write_env_config "$new_config"
                print_config "$new_config"
                ;;
            remove|rm)
                [ $# -eq 0 ] && { echo "Usage: $(basename "$0") config remove <name>..." >&2; exit 1; }
                new_config="$CONFIG"
                for n in "$@"; do
                    case " $new_config " in
                        *" $n "*)
                            # Drop $n by rebuilding the list
                            tmp=""
                            for tok in $new_config; do
                                [ "$tok" = "$n" ] || tmp="${tmp:+$tmp }$tok"
                            done
                            new_config="$tmp"
                            ;;
                        *)  echo "Not present: $n" ;;
                    esac
                done
                write_env_config "$new_config"
                print_config "$new_config"
                ;;
            *)
                echo "Unknown config subcommand: $sub" >&2
                echo "Use: config | config add <name>... | config remove <name>..." >&2
                exit 1
                ;;
        esac
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
  start                 Start the stack (docker compose up -d --wait)
  stop                  Stop the stack (docker compose down)
  restart [service]     Restart the stack (or named services)
  restart --except <svc>...
                        Restart all services except the named ones
  recreate [service]    Stop then start, or force-recreate one service (--no-deps)
  recreate --except <svc>...
                        Force-recreate all services except the named ones (--no-deps)
  status                Show service status
  logs [service]        Follow logs (optionally for a single service)
  inspect <service>     Inspect a service's container (forwards extra args to docker inspect)
  printenv <service>    Print a service's environment variables (one per line)
  pull                  Pull all images
  config                Show CONFIG list of the compose files
  config add <name>     Add overrides to CONFIG in .env (validates the file exists)
  config remove <name>  Remove overrides from CONFIG in .env
  compose-config        Dump the fully-resolved docker compose config
  secrets               Show key passwords and API keys from .env

EOF
        ;;
    *)
        echo "Unknown command: $CMD" >&2
        echo "Run '$0 help' for usage." >&2
        exit 1
        ;;
esac
