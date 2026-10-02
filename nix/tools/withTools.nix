{
  buildToolbox,
  checkedShellScript,
  curl,
  lib,
  libfaketime,
  postgresqlVersions,
  postgrest,
  python3Packages,
  writeText,
  writers,
}:
let
  withTmpDb =
    {
      name,
      postgresql,
      config ? "",
    }:
    let
      commandName = "postgrest-with-${name}";
      postgresqlConf = writeText "postgresql.conf" (
        "
        autovacuum = false
        listen_addresses = ''
        log_statement = all
        shared_preload_libraries=pg_stat_statements
      "
        + config
      );
    in
    checkedShellScript
      {
        name = commandName;
        docs = "Run the given command in a temporary database with ${name}. If you wish to mutate the database, login with the postgres role.";
        args = [
          "ARG_OPTIONAL_SINGLE([fixtures], [f], [SQL file to load fixtures from])"
          "ARG_POSITIONAL_SINGLE([command], [Command to run])"
          "ARG_LEFTOVERS([command arguments])"
          "ARG_USE_ENV([PGUSER], [Postgrest_Test_Authenticator], [Authenticator PG role])" # user is written in mixed case to implicitly test that it is being properly quoted in schema cache queries
          "ARG_USE_ENV([PGDATABASE], [postgres], [PG database name])"
          "ARG_USE_ENV([PGRST_DB_SCHEMAS], [test], [Schema to expose])"
          "ARG_USE_ENV([PGTZ], [utc], [Timezone to use])"
          "ARG_USE_ENV([PGOPTIONS], [-c search_path=public,test], [PG options to use])"
          "ARG_OPTIONAL_BOOLEAN([replica],, [Enable a replica for the database])"
        ];
        positionalCompletion = "_command";
        workingDir = "/";
        redirectTixFiles = false;
        withPath = [ postgresql ];
        withTmpDir = true;
      }
      ''
        setuplog="$tmpdir/setup.log"

        log () {
          echo "$1" >> "$setuplog"
        }

        # Avoid starting multiple layers of withTmpDb, but make sure to have the last invocation
        # load fixtures. Otherwise postgrest-with-pg-xx postgrest-test-io would not be possible.
        if ! test -v PGHOST; then

          mkdir -p "$tmpdir"/{db,socket}
          # remove data dir, even if we keep tmpdir - no need to upload it to artifacts
          trap 'rm -rf $tmpdir/db' EXIT

          export PGDATA="$tmpdir/db"
          export PGHOST="$tmpdir/socket"
          export PGUSER
          export PGDATABASE
          export PGRST_DB_SCHEMAS
          export PGTZ
          export PGOPTIONS

          HBA_FILE="$tmpdir/pg_hba.conf"
          echo "local $PGDATABASE some_protected_user password" > "$HBA_FILE"
          echo "local $PGDATABASE all trust" >> "$HBA_FILE"
          echo "local replication all trust" >> "$HBA_FILE"

          log "Initializing database cluster..."
          # We try to make the database cluster as independent as possible from the host
          # by specifying the timezone, locale and encoding.
          # initdb -U creates a superuser(man initdb)
          TZ=$PGTZ initdb --no-locale --encoding=UTF8 --nosync -U postgres --auth=trust \
            >> "$setuplog"

          # Append our own config to the one initdb created to avoid replacing
          # default values created by the latter.
          cat ${postgresqlConf} >> "$tmpdir/db/postgresql.conf"

          log "Starting the database cluster..."

          # Instead of listening on a local port, we will listen on a unix domain socket.
          # NOTE: unix domain socket filename name must remain under max limit.
          # On Linux, it's 108 chars (including '\0' terminator)
          # On MacOS, it's 104 chars
          # See: https://serverfault.com/questions/641347/check-if-a-path-exceeds-maximum-for-unix-domain-socket

          pg_ctl -l "$tmpdir/db.log" -w start -o "-F -c hba_file=$HBA_FILE -k $PGHOST " \
            >> "$setuplog"

          log "Creating a minimally privileged $PGUSER connection role..."
          createuser "$PGUSER" -U postgres --host="$tmpdir/socket" --no-createdb --no-inherit --no-superuser --no-createrole --no-replication --login

          >&2 echo "${commandName}: You can connect with: psql 'postgres:///$PGDATABASE?host=$PGHOST' -U postgres"
          >&2 echo "${commandName}: You can tail the logs with: tail -f $tmpdir/db.log"

          if test "$_arg_replica" = "on"; then
            replica_slot="replica_$RANDOM"
            replica_dir="$tmpdir/$replica_slot"
            replica_host="$tmpdir/socket_$replica_slot"

            mkdir -p "$replica_host"

            replica_dblog="$tmpdir/db_$replica_slot.log"

            log "Running pg_basebackup for $replica_slot"

            pg_basebackup -v -h "$PGHOST" -U postgres --wal-method=stream --create-slot --slot="$replica_slot" --write-recovery-conf -D "$replica_dir" \
              >> "$setuplog" 2>&1

            log "Starting replica on $replica_host"

            # We set a low max_standby_streaming_delay to make the replication conflict fail faster in tests (otherwise it waits for the default 30s)
            pg_ctl -D "$replica_dir" -l "$replica_dblog" -w start -o "-F -c hba_file=$HBA_FILE -k $replica_host -c max_standby_streaming_delay=\"3s\" " \
              >> "$setuplog"

            >&2 echo "${commandName}: Replica enabled. You can connect to it with: psql 'postgres:///$PGDATABASE?host=$replica_host' -U postgres"
            >&2 echo "${commandName}: You can tail the replica logs with: tail -f $replica_dblog"

            export PGREPLICAHOST="$replica_host"
            export PGREPLICASLOT="$replica_slot"
            export PGRST_DB_URI="postgres:///$PGDATABASE?host=$PGREPLICAHOST,$PGHOST"
          fi

          # shellcheck disable=SC2329
          stop () {
            log "Stopping the database cluster..."
            pg_ctl stop --mode=immediate >> "$setuplog"
            rm -rf "$tmpdir/db"
            if test "$_arg_replica" = "on"; then
              log "Stopping the replica cluster..."
              pg_ctl -D "$replica_dir" stop --mode=immediate >> "$setuplog"
              rm -rf "$replica_dir"
            fi
          }
          trap stop EXIT
        fi

        if test "$_arg_fixtures"; then
          load_start=$SECONDS
          >&2 printf "${commandName}: Loading fixtures under the postgres role..."
          psql -U postgres -v PGUSER="$PGUSER" -v ON_ERROR_STOP=1 -f "$_arg_fixtures" >> "$setuplog"
          psql -U postgres -v ON_ERROR_STOP=1 -c "VACUUM ANALYZE;" >> "$setuplog"
          load_end=$((SECONDS - load_start))
          >&2 printf " done in %ss. Running command...\n" "$load_end"
        fi

        ("$_arg_command" "''${_arg_leftovers[@]}")
      '';

  # Helper script for running a command against all PostgreSQL versions.
  withPgAll =
    let
      runners = map (version: ''
        cat << EOF

        Running against ${version.name}...

        EOF

        trap 'echo "Failed on ${version.name}"' exit

        (${withTmpDb version} "$_arg_command" "''${_arg_leftovers[@]}")

        trap "" exit

        cat << EOF

        Done running against ${version.name}.

        EOF
      '') postgresqlVersions;
    in
    checkedShellScript {
      name = "postgrest-with-all";
      docs = "Run command against all supported PostgreSQL versions.";
      args = [
        "ARG_POSITIONAL_SINGLE([command], [Command to run])"
        "ARG_LEFTOVERS([command arguments])"
      ];
      positionalCompletion = "_command";
      workingDir = "/";
    } (lib.concatStringsSep "\n\n" runners);

  withPg = withTmpDb (builtins.head postgresqlVersions);

  waitForPgrstReady =
    checkedShellScript
      {
        name = "postgrest-wait-for-pgrst-ready";
        docs = "Wait for PostgREST to be ready to serve requests. Needs to be a separate command for timeout to work below.";
        args = [
          "ARG_USE_ENV([PGRST_SERVER_UNIX_SOCKET], [], [Unix socket to check for running PostgREST instance])"
        ];
      }
      ''
        # ARG_USE_ENV only adds defaults or docs for environment variables
        # We manually implement a required check here
        # See also: https://github.com/matejak/argbash/issues/80
        : "''${PGRST_SERVER_UNIX_SOCKET:?PGRST_SERVER_UNIX_SOCKET is required}"

        function check_status () {
          ${curl}/bin/curl -s -o /dev/null -w "%{http_code}" --unix-socket "$PGRST_SERVER_UNIX_SOCKET" http://localhost/
        }

        while [[ "$(check_status)" != "200" ]];
           do sleep 0.1;
        done
      '';

  # Broadcast SIGINT to any running postgrest instances on the host. Uses python for cross-platform compatibility.
  signalPostgrest =
    writers.writePython3 "postgrest-signal-int" { libraries = [ python3Packages.psutil ]; }
      ''
        import psutil
        import signal

        for proc in psutil.process_iter(["name"]):
            try:
                if proc.info["name"] == "postgrest":
                    proc.send_signal(signal.SIGINT)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
      '';

  withPgrst =
    let
      commandName = "postgrest-with-pgrst";
    in
    checkedShellScript
      {
        name = commandName;
        docs = "Build and run PostgREST and run <command> with PGRST_SERVER_UNIX_SOCKET set.";
        args = [
          "ARG_POSITIONAL_SINGLE([command], [Command to run])"
          "ARG_LEFTOVERS([command arguments])"
          "ARG_OPTIONAL_SINGLE([faketime], [f], [Fake the system time when starting PostgREST. This is useful to test expiry of JWT, for example in loadtests])"
          "ARG_OPTIONAL_SINGLE([monitor], [m], [Enable CPU and memory monitoring of the PostgREST process and output to the designated file as markdown])"
          "ARG_OPTIONAL_SINGLE([timeout], [t], [Maximum time to wait for PostgREST to be ready], [5])"
          "ARG_OPTIONAL_SINGLE([sleep], [s],   [Sleep time after PostgREST is ready, this is useful for monitoring])"
          "ARG_USE_ENV([FAKETIME_LIB], [${libfaketime}/lib/libfaketime.so.1], [Faketime Library to preload])"
          "ARG_USE_ENV([PGRST_CMD], [postgrest-run], [PostgREST executable to run])"
        ];
        positionalCompletion = "_command";
        workingDir = "/";
        withEnv = postgrest.env;
        withTmpDir = true;
      }
      ''
        export PGRST_SERVER_UNIX_SOCKET="$tmpdir"/postgrest.socket

        if [ "''${PGRST_CMD}" == "postgrest-run" ]; then
          build_start=$SECONDS
          echo -n "${commandName}: Building postgrest (cabal)... "
          postgrest-build
          build_end=$((SECONDS - build_start))
          printf "done in %ss.\n" "$build_end"
        fi

        ver=$($PGRST_CMD --version)

        echo -n "${commandName}: Starting $ver... "

        if [[ -n "$_arg_faketime" ]]; then
          LD_PRELOAD="$FAKETIME_LIB" FAKETIME="$_arg_faketime" "$PGRST_CMD" > "$tmpdir"/run.log 2>&1 &
        else
          $PGRST_CMD > "$tmpdir"/run.log 2>&1 &
        fi
        pid=$!
        # shellcheck disable=SC2329
        cleanup() {
          # Send INT to all postgrest processes.
          # Workaround to trigger dumping postgrest.prof for postgrest-profiled-run
          # Caveat: we cannot realistically limit this to the current process' tree,
          # since pkill's --parent supports only direct children; therefore this
          # would reap neighbor postgrest instances as well, because INT is asking
          # the process to terminate too.
          # TODO: consider cgroups to make this cleaner
          ${signalPostgrest}
          kill "$pid" || true
        }
        trap cleanup EXIT

        wait_start=$SECONDS
        timeout -s TERM "$_arg_timeout" ${waitForPgrstReady} || {
          echo "timed out, output:"
          cat "$tmpdir"/run.log
          exit 1
        }
        wait_duration=$((SECONDS - wait_start))
        printf "done in %ss.\n" "$wait_duration"

        echo "${commandName}: You can tail the server logs with: tail -f $tmpdir/run.log"

        if [[ -n "$_arg_monitor" ]]; then
          ${monitorPid} "$pid" > "$_arg_monitor" &
        fi

        if [[ -n "$_arg_sleep" ]]; then
          sleep "$_arg_sleep"
        fi

        ("$_arg_command" "''${_arg_leftovers[@]}")
      '';

  monitorPid = writers.writePython3 "postgrest-monitor-pid" {
    libraries = [
      python3Packages.pandas
      python3Packages.tabulate
      python3Packages.psutil
    ];
  } (builtins.readFile ./monitor_pid.py);
in
buildToolbox {
  name = "postgrest-with";
  tools = {
    inherit
      withPgAll
      withPgrst
      ;
  }
  // builtins.listToAttrs (
    # Create a `postgrest-with-pg-` for each PostgreSQL version
    map (pg: {
      inherit (pg) name;
      value = withTmpDb pg;
    }) postgresqlVersions
  );
  # make latest withPg available for other nix files
  extra = { inherit withPg; };
}
