#!/bin/bash

set -eEuo pipefail

export PGPASSWORD=postgres
export PGUSER=supabase_admin
export PGHOST=localhost
export PGDATABASE=postgres

ARTIFACTS_BUCKET_NAME=${1:-}
if [[ -z $ARTIFACTS_BUCKET_NAME ]]; then
	echo "Usage: $0 <ARTIFACTS_BUCKET_NAME> [INITIAL_PG_VERSION]"
	exit 1
fi

INITIAL_PG_VERSION=${2:-15.1.1.60}
LATEST_PG_VERSION=$(sed -e 's/postgres-version = "\(.*\)"/\1/g' ../../common.vars.pkr.hcl)

LATEST_VERSION_SCRIPTS="scripts/pg_upgrade_scripts-${LATEST_PG_VERSION}.tar.gz"
LATEST_VERSION_BIN="scripts/pg_upgrade_bin-${LATEST_PG_VERSION}.tar.gz"

if [[ ! -f $LATEST_VERSION_SCRIPTS ]]; then
	aws s3 cp "s3://${ARTIFACTS_BUCKET_NAME}/upgrades/postgres/supabase-postgres-${LATEST_PG_VERSION}/pg_upgrade_scripts.tar.gz" "$LATEST_VERSION_SCRIPTS"
fi

if [[ ! -f $LATEST_VERSION_BIN ]]; then
	aws s3 cp "s3://${ARTIFACTS_BUCKET_NAME}/upgrades/postgres/supabase-postgres-${LATEST_PG_VERSION}/24.04.tar.gz" "$LATEST_VERSION_BIN"
fi

rm -rf scripts/pg_upgrade_scripts
cp "$LATEST_VERSION_SCRIPTS" scripts/pg_upgrade_scripts.tar.gz
cp "$LATEST_VERSION_BIN" scripts/pg_upgrade_bin.tar.gz

docker rm -f pg_upgrade_test || true

docker run -t --name pg_upgrade_test --env-file .env \
	-v "$(pwd)/scripts:/tmp/upgrade" \
	--entrypoint /tmp/upgrade/entrypoint.sh -d \
	-p 5432:5432 \
	"supabase/postgres:${INITIAL_PG_VERSION}"

sleep 3
while ! docker exec -it pg_upgrade_test bash -c "pg_isready"; do
	echo "Waiting for postgres to start..."
	sleep 1
done

echo "Running migrations"
docker cp ../../migrations/db/migrations "pg_upgrade_test:/docker-entrypoint-initdb.d/"
if ! docker exec -it pg_upgrade_test bash -c '/docker-entrypoint-initdb.d/migrate.sh > /tmp/migrate.log 2>&1; exit $?'; then
	echo "Running migrations failed. Exiting."
	exit 1
fi

echo "Running tests"
pg_prove "../../migrations/tests/test.sql"
psql -f "./tests/97-enable-extensions.sql"
psql -f "./tests/98-data-fixtures.sql"
psql -f "./tests/99-fixtures.sql"

echo "Initiating pg_upgrade"
if ! docker exec -it pg_upgrade_test bash -c '/tmp/upgrade/pg_upgrade_scripts/initiate.sh "$PG_MAJOR_VERSION"; exit $?'; then
	echo "Initiating pg_upgrade failed. Exiting."
	exit 1
fi

sleep 3
echo "Completing pg_upgrade"
if ! docker exec -it pg_upgrade_test bash -c 'rm -f /tmp/pg-upgrade-status; /tmp/upgrade/pg_upgrade_scripts/complete.sh; exit $?'; then
	echo "Completing pg_upgrade failed. Exiting."
	exit 1
fi

pg_prove tests/01-schema.sql
pg_prove tests/02-data.sql
pg_prove tests/03-settings.sql
