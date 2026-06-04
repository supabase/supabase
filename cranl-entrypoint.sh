#!/bin/sh

set -eu

cd /supabase

set_env_file() {
    key="$1"
    value="$2"

    [ -n "$value" ] || return 0

    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        printf '\n%s=%s\n' "$key" "$value" >> .env
    fi
}

wait_for_docker() {
    i=0
    while ! docker info >/dev/null 2>&1; do
        i=$((i + 1))
        if [ "$i" -gt 60 ]; then
            echo "Docker daemon did not start. Recent dockerd logs:" >&2
            tail -n 200 /tmp/dockerd.log >&2 || true
            exit 1
        fi
        sleep 1
    done
}

shutdown() {
    echo "Stopping Supabase services..."
    sh run.sh stop || true
    kill "$dockerd_pid" 2>/dev/null || true
    wait "$dockerd_pid" 2>/dev/null || true
}

dockerd-entrypoint.sh --host=unix:///var/run/docker.sock > /tmp/dockerd.log 2>&1 &
dockerd_pid="$!"
trap shutdown INT TERM

wait_for_docker

if [ ! -f .env ]; then
    cp .env.example .env
fi

if grep -q '^POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password$' .env; then
    sh utils/generate-keys.sh --update-env >/dev/null
    sh utils/add-new-auth-keys.sh --update-env >/dev/null
fi

if [ -n "${PORT:-}" ]; then
    export KONG_HTTP_PORT="$PORT"
fi

set_env_file COMPOSE_FILE "${COMPOSE_FILE:-docker-compose.yml:docker-compose.logs.yml:docker-compose.cranl.yml}"
set_env_file KONG_HTTP_PORT "${KONG_HTTP_PORT:-8000}"
set_env_file KONG_HTTPS_PORT "${KONG_HTTPS_PORT:-8443}"
set_env_file REGION "${REGION:-saudi-arabia-1}"
set_env_file DOCKER_SOCKET_LOCATION "${DOCKER_SOCKET_LOCATION:-/var/run/docker.sock}"

set_env_file SUPABASE_PUBLIC_URL "${SUPABASE_PUBLIC_URL:-}"
set_env_file API_EXTERNAL_URL "${API_EXTERNAL_URL:-}"
set_env_file SITE_URL "${SITE_URL:-}"

set_env_file STORAGE_BACKEND "${STORAGE_BACKEND:-}"
set_env_file GLOBAL_S3_BUCKET "${GLOBAL_S3_BUCKET:-}"
set_env_file GLOBAL_S3_ENDPOINT "${GLOBAL_S3_ENDPOINT:-}"
set_env_file GLOBAL_S3_PROTOCOL "${GLOBAL_S3_PROTOCOL:-}"
set_env_file GLOBAL_S3_FORCE_PATH_STYLE "${GLOBAL_S3_FORCE_PATH_STYLE:-}"
set_env_file AWS_ACCESS_KEY_ID "${AWS_ACCESS_KEY_ID:-}"
set_env_file AWS_SECRET_ACCESS_KEY "${AWS_SECRET_ACCESS_KEY:-}"

sh run.sh start
sh run.sh status

exec sh run.sh logs
