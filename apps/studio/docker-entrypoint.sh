#!/usr/bin/env bash
set -Eeuo pipefail

# usage: file_env VAR [DEFAULT]
file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"
	if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
		echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
		exit 1
	fi
	local val="$def"
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(<"${!fileVar}")"
	fi
	export "$var"="$val"
	unset "$fileVar"
}

# load secrets either from environment variables or files
file_env 'POSTGRES_PASSWORD'
file_env 'SUPABASE_ANON_KEY'
file_env 'SUPABASE_SERVICE_KEY'

# Write .env.local so Next.js picks up Docker env vars with highest priority.
# Next.js loads .env.local AFTER .env, so these values override the baked-in .env.
ENV_LOCAL_PATH="${APP_DIR:-/app/apps/studio}/.env.local"
{
  [ -n "${STUDIO_PG_META_URL:-}" ]           && echo "STUDIO_PG_META_URL=${STUDIO_PG_META_URL}"
  [ -n "${POSTGRES_HOST:-}" ]                && echo "POSTGRES_HOST=${POSTGRES_HOST}"
  [ -n "${POSTGRES_PORT:-}" ]                && echo "POSTGRES_PORT=${POSTGRES_PORT}"
  [ -n "${POSTGRES_PASSWORD:-}" ]            && echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
  [ -n "${POSTGRES_DOCKER_HOST:-}" ]         && echo "POSTGRES_DOCKER_HOST=${POSTGRES_DOCKER_HOST}"
  [ -n "${POSTGRES_DOCKER_PORT:-}" ]         && echo "POSTGRES_DOCKER_PORT=${POSTGRES_DOCKER_PORT}"
  [ -n "${SUPABASE_URL:-}" ]                 && echo "SUPABASE_URL=${SUPABASE_URL}"
  [ -n "${SUPABASE_PUBLIC_URL:-}" ]          && echo "SUPABASE_PUBLIC_URL=${SUPABASE_PUBLIC_URL}"
  [ -n "${SUPABASE_ANON_KEY:-}" ]            && echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}"
  [ -n "${SUPABASE_SERVICE_KEY:-}" ]         && echo "SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}"
  [ -n "${PG_META_CRYPTO_KEY:-}" ]           && echo "PG_META_CRYPTO_KEY=${PG_META_CRYPTO_KEY}"
  [ -n "${DATABASE_REGISTRY_PATH:-}" ]       && echo "DATABASE_REGISTRY_PATH=${DATABASE_REGISTRY_PATH}"
  [ -n "${DEFAULT_ORGANIZATION_NAME:-}" ]    && echo "DEFAULT_ORGANIZATION_NAME=${DEFAULT_ORGANIZATION_NAME}"
  [ -n "${DEFAULT_PROJECT_NAME:-}" ]         && echo "DEFAULT_PROJECT_NAME=${DEFAULT_PROJECT_NAME}"
  [ -n "${DASHBOARD_USERNAME:-}" ]           && echo "DASHBOARD_USERNAME=${DASHBOARD_USERNAME}"
  [ -n "${DASHBOARD_PASSWORD:-}" ]           && echo "DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}"
} > "$ENV_LOCAL_PATH"

echo "[entrypoint] wrote ${ENV_LOCAL_PATH} with Docker env overrides"

exec "${@}"
