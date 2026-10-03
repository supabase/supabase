#!/usr/bin/env bash

DB_ENV=$1

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export GOTRUE_DB_DRIVER="postgres"
export GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:root@localhost:5432/$DB_ENV"
export GOTRUE_DB_MIGRATIONS_PATH=$DIR/../migrations

go run main.go migrate -c "$DIR/test.env" "${@:2}"
