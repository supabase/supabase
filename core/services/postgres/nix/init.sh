#!/bin/bash

export PGUSER=supabase_admin
export PGDATA=$PWD/postgres_data
export PGHOST=$PWD/postgres
export PGPORT=5432
export PGPASS=postgres
export LOG_PATH=$PGHOST/LOG
export PGDATABASE=testdb
export DATABASE_URL="postgresql:///$PGDATABASE?host=$PGHOST&port=$PGPORT"
mkdir -p "$PGHOST"
if [[ ! -d $PGDATA ]]; then
	echo 'Initializing postgresql database...'
	initdb "$PGDATA" --locale=C --username $PGUSER -A md5 --pwfile=<(echo $PGPASS) --auth=trust
	cat <<-EOF >>"$PGDATA/postgresql.conf"
		listen_addresses='*'
		unix_socket_directories='$PGHOST'
		unix_socket_permissions=0700
	EOF
fi
chmod o-rwx "$PGDATA"
