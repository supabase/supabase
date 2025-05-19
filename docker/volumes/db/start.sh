#!/bin/bash
set -e

echo "Starting PostgreSQL..."
# Start PostgreSQL as the postgres user
gosu postgres postgres -c config_file=/etc/postgresql/postgresql.conf -c log_min_messages=fatal &
PGPID=$!

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready; do
    echo "PostgreSQL not ready yet..."
    # Check if PostgreSQL is still running
    if ! kill -0 $PGPID 2>/dev/null; then
        echo "PostgreSQL process died! Check the logs above for errors."
        exit 1
    fi
    sleep 1
done

echo "PostgreSQL is ready!"

echo "Updating passwords..."
# Update passwords using roles.sql
psql -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/init-scripts/99-roles.sql

# Wait for the PostgreSQL process
wait $PGPID 