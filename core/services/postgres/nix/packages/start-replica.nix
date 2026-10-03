{
  writeShellApplication,
  pgsqlSuperuser,
  psql_15,
}:
writeShellApplication {
  name = "start-postgres-replica";
  runtimeInputs = [ ];
  text = ''
    # first argument should be '15' or '16' for the version
    if [ "$1" == "15" ]; then
        echo "Starting server for PSQL 15"
        BINDIR="${psql_15}"
    elif [ "$1" == "16" ]; then
        echo "Starting server for PSQL 16"
        echo "Error: PSQL 16 is not configured in this package"
        exit 1
    elif [ "$1" == "orioledb-16" ]; then
        echo "Starting server for PSQL ORIOLEDB 16"
        echo "Error: PSQL ORIOLEDB 16 is not configured in this package"
        exit 1
    else
        echo "Please provide a valid Postgres version (15, 16 or orioledb-16)"
        exit 1
    fi

    export PATH="$BINDIR/bin:$PATH"

    PGSQL_SUPERUSER="${pgsqlSuperuser}"
    MASTER_PORTNO="$2"
    REPLICA_PORTNO="$3"
    REPLICA_SLOT="replica_$RANDOM"
    DATDIR=$(mktemp -d)
    mkdir -p "$DATDIR"

    echo "NOTE: runing pg_basebackup for server on port $MASTER_PORTNO"
    echo "NOTE: using replica slot $REPLICA_SLOT"

    pg_basebackup -p "$MASTER_PORTNO" -h localhost -U "''${PGSQL_SUPERUSER}" -X stream -C -S "$REPLICA_SLOT" -v -R -D "$DATDIR"

    echo "NOTE: using port $REPLICA_PORTNO for replica"
    echo "NOTE: using temporary directory $DATDIR for data, which will not be removed"
    echo "NOTE: you are free to re-use this data directory at will"
    echo

    exec postgres -p "$REPLICA_PORTNO" -D "$DATDIR" -k /tmp
  '';
}
