{ writeShellApplication, psql_15 }:
let
  configFile = ../tests/postgresql.conf.in;
  getkeyScript = ../tests/util/pgsodium_getkey.sh;
  primingScript = ../tests/prime.sql;
  primingSuperuserScript = ../tests/prime-superuser.sql;
  migrationData = ../tests/migrations/data.sql;
in
writeShellApplication {
  name = "migrate-postgres";
  runtimeInputs = [ ];
  text = ''
    # first argument is the old version; a path 15 or 16
    if [[ $1 == /nix/store* ]]; then
        if [ ! -L "$1/receipt.json" ] || [ ! -e "$1/receipt.json" ]; then
            echo "ERROR: $1 does not look like a valid Postgres install"
            exit 1
        fi
        OLDVER="$1"
    elif [ "$1" == "15" ]; then
        OLDVER="${psql_15}"
    elif [ "$1" == "16" ]; then
        echo "ERROR: PSQL 16 is not configured in this package"
        exit 1
    else
        echo "Please provide a valid Postgres version (15 or 16), or a /nix/store path"
        exit 1
    fi

    # second argument is the new version; 15 or 16
    if [[ $2 == /nix/store* ]]; then
        if [ ! -L "$2/receipt.json" ] || [ ! -e "$2/receipt.json" ]; then
            echo "ERROR: $1 does not look like a valid Postgres install"
            exit 1
        fi
        NEWVER="$2"
    elif [ "$2" == "15" ]; then
        NEWVER="${psql_15}"
    elif [ "$2" == "16" ]; then
        echo "ERROR: PSQL 16 is not configured in this package"
        exit 1
    else
        echo "Please provide a valid Postgres version (15 or 16), or a /nix/store path"
        exit 1
    fi

    # thid argument is the upgrade method: either pg_dumpall or pg_ugprade
    if [ "$3" != "pg_dumpall" ] && [ "$3" != "pg_upgrade" ]; then
        echo "Please provide a valid upgrade method (pg_dumpall or pg_upgrade)"
        exit 1
    fi
    UPGRADE_METHOD="$3"

    echo "Old server build: PSQL $1"
    echo "New server build: PSQL $2"
    echo "Upgrade method: $UPGRADE_METHOD"

    DATDIR=$(mktemp -d)
    NEWDAT=$(mktemp -d)
    mkdir -p "$DATDIR" "$NEWDAT"

    echo "NOTE: using temporary directory $DATDIR for PSQL $1 data, which will not be removed"
    echo "NOTE: you are free to re-use this data directory at will"
    echo

    "$OLDVER/bin/initdb" -D "$DATDIR" --locale=C --username=supabase_admin
    "$NEWVER/bin/initdb" -D "$NEWDAT" --locale=C --username=supabase_admin

    # NOTE (aseipp): we need to patch postgresql.conf to have the right pgsodium_getkey script
    PSQL_CONF_FILE="${configFile}"
    PGSODIUM_GETKEY_SCRIPT="${getkeyScript}"
    echo "NOTE: patching postgresql.conf files"
    for x in "$DATDIR" "$NEWDAT"; do
      sed \
        "s#@PGSODIUM_GETKEY_SCRIPT@#$PGSODIUM_GETKEY_SCRIPT#g" \
        "$PSQL_CONF_FILE" > "$x/postgresql.conf"
    done

    echo "NOTE: Starting first server (v''${1}) to load data into the system"
    "$OLDVER/bin/pg_ctl" start -D "$DATDIR"

    PRIMING_SCRIPT="${primingScript}"
    PRIMING_SUPERUSER_SCRIPT="${primingSuperuserScript}"
    MIGRATION_DATA="${migrationData}"

    "$OLDVER/bin/psql" -h localhost -d postgres -Xf "$PRIMING_SCRIPT"
    "$OLDVER/bin/psql" -h localhost -d postgres -Xf "$PRIMING_SUPERUSER_SCRIPT"
    "$OLDVER/bin/psql" -h localhost -d postgres -Xf "$MIGRATION_DATA"

    if [ "$UPGRADE_METHOD" == "pg_upgrade" ]; then
      echo "NOTE: Stopping old server (v''${1}) to prepare for migration"
      "$OLDVER/bin/pg_ctl" stop -D "$DATDIR"

      echo "NOTE: Migrating old data $DATDIR to $NEWDAT using pg_upgrade"

      export PGDATAOLD="$DATDIR"
      export PGDATANEW="$NEWDAT"
      export PGBINOLD="$OLDVER/bin"
      export PGBINNEW="$NEWVER/bin"

      if ! "$NEWVER/bin/pg_upgrade" --check; then
          echo "ERROR: pg_upgrade check failed"
          exit 1
      fi

      echo "NOTE: pg_upgrade check passed, proceeding with migration"
      "$NEWVER/bin/pg_upgrade"
      rm -f delete_old_cluster.sh # we don't need this
      exit 0
    fi

    if [ "$UPGRADE_METHOD" == "pg_dumpall" ]; then
        SQLDAT="$DATDIR/dump.sql"
        echo "NOTE: Exporting data via pg_dumpall ($SQLDAT)"
        "$NEWVER/bin/pg_dumpall" -h localhost > "$SQLDAT"

        echo "NOTE: Stopping old server (v''${1}) to prepare for migration"
        "$OLDVER/bin/pg_ctl" stop -D "$DATDIR"

        echo "NOTE: Starting second server (v''${2}) to load data into the system"
        "$NEWVER/bin/pg_ctl" start -D "$NEWDAT"

        echo "NOTE: Loading data into new server (v''${2}) via 'cat | psql'"
        cat "$SQLDAT" | "$NEWVER/bin/psql" -h localhost -d postgres

        printf "\n\n\n\n"
        echo "NOTE: Done, check logs. Stopping the server; new database is located at $NEWDAT"
        "$NEWVER/bin/pg_ctl" stop -D "$NEWDAT"
    fi
  '';
}
