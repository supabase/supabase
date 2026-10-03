{ self, ... }:
{
  perSystem =
    {
      self',
      pkgs,
      lib,
      ...
    }:
    let
      pkgs-lib = pkgs.callPackage ./packages/lib.nix {
        psql_15 = self'.packages."psql_15/bin";
        psql_17 = self'.packages."psql_17/bin";
        psql_orioledb-17 = self'.packages."psql_orioledb-17/bin";
        inherit (self.supabase) defaults;
      };
      bashlog = builtins.fetchurl {
        url = "https://raw.githubusercontent.com/Zordrak/bashlog/master/log.sh";
        sha256 = "1vrjcbzls0ba2qkg7ffddz2gxqn2rlj3wyvril2gz0mfi89y9vk9";
      };
    in
    {
      checks =
        let
          # Create a testing harness for a PostgreSQL package. This is used for
          # 'nix flake check', and works with any PostgreSQL package you hand it.
          # deadnix: skip
          makeCheckHarness =
            pgpkg:
            {
              isCliVariant ? false,
              isSlim ? false,
            }:
            let
              isOrioleDB = lib.strings.hasPrefix "orioledb-" pgpkg.version;
              pg_prove = pkgs.perlPackages.TAPParserSourceHandlerpgTAP;
              inherit (self'.packages) pg_regress pg_isolation_regress;
              getkey-script = pkgs.stdenv.mkDerivation {
                name = "pgsodium-getkey";
                buildCommand = ''
                  mkdir -p $out/bin
                  cat > $out/bin/pgsodium-getkey << 'EOF'
                  #!${pkgs.bash}/bin/bash
                  set -euo pipefail

                  TMPDIR_BASE=$(mktemp -d)

                  KEY_DIR="''${PGSODIUM_KEY_DIR:-$TMPDIR_BASE/pgsodium}"
                  KEY_FILE="$KEY_DIR/pgsodium.key"

                  if ! mkdir -p "$KEY_DIR" 2>/dev/null; then
                    echo "Error: Could not create key directory $KEY_DIR" >&2
                    exit 1
                  fi
                  chmod 1777 "$KEY_DIR"

                  if [[ ! -f "$KEY_FILE" ]]; then
                    if ! (dd if=/dev/urandom bs=32 count=1 2>/dev/null | od -A n -t x1 | tr -d ' \n' > "$KEY_FILE"); then
                      if ! (openssl rand -hex 32 > "$KEY_FILE"); then
                        echo "00000000000000000000000000000000" > "$KEY_FILE"
                        echo "Warning: Using fallback key" >&2
                      fi
                    fi
                    chmod 644 "$KEY_FILE"
                  fi

                  if [[ -f "$KEY_FILE" && -r "$KEY_FILE" ]]; then
                    cat "$KEY_FILE"
                  else
                    echo "Error: Cannot read key file $KEY_FILE" >&2
                    exit 1
                  fi
                  EOF
                  chmod +x $out/bin/pgsodium-getkey
                '';
              };

              pgroonga = self'.legacyPackages."psql_${pgpkg.version}".exts.pgroonga;
              supautils = self'.legacyPackages."psql_${pgpkg.version}".exts.supautils;

              # Use different ports to allow parallel test runs
              # slim packages get their own ports to avoid conflicts
              pgPort =
                if (pgpkg.version == "17" && isSlim) then
                  "5538"
                else if (pgpkg.version == "15" && isSlim) then
                  "5539"
                else if (isOrioleDB && isSlim) then
                  "5540"
                else if (pgpkg.version == "17" && isCliVariant) then
                  "5541"
                else if (pgpkg.version == "17") then
                  "5535"
                else if (pgpkg.version == "15") then
                  "5536"
                else
                  "5537";

              # Script to generate shared_preload_libraries dynamically based on receipt.json
              generatePreloadLibs = pkgs.writeShellScript "generate-preload-libs" ''
                RECEIPT_FILE="$1"

                # Define which extensions should be preloaded (in order of priority)
                WANTED_EXTS=(
                  "pg_stat_statements"
                  "pgaudit"
                  "plpgsql"
                  "plpgsql_check"
                  "pg_cron"
                  "pg_net"
                  "pgsodium"
                  "timescaledb"
                  "auto_explain"
                  "pg_tle"
                  "plan_filter"
                  "supabase_vault"
                )

                # Extract available extensions from receipt
                AVAILABLE_EXTS=$(${pkgs.jq}/bin/jq -r '.extensions[].name' "$RECEIPT_FILE")

                # Build the preload list (comma-separated, no individual quotes)
                PRELOAD_LIST=""
                for ext in "''${WANTED_EXTS[@]}"; do
                  if echo "$AVAILABLE_EXTS" | grep -q "^$ext\$"; then
                    if [ -z "$PRELOAD_LIST" ]; then
                      PRELOAD_LIST="$ext"
                    else
                      PRELOAD_LIST="$PRELOAD_LIST, $ext"
                    fi
                  fi
                done

                echo "$PRELOAD_LIST"
              '';

              # Use the shared setup but with a test-specific name
              start-postgres-server-bin = pkgs-lib.makePostgresDevSetup {
                inherit pkgs pgroonga;
                name = "start-postgres-server-test";
                extraSubstitutions = {
                  PGSODIUM_GETKEY = "${getkey-script}/bin/pgsodium-getkey";
                  PGSQL_DEFAULT_PORT = pgPort;
                };
              };

              # Tests to skip for OrioleDB (not compatible with OrioleDB storage)
              orioleDBSkipTests = [
                "index_advisor" # index_advisor doesn't support OrioleDB tables
              ];

              # Helper function to filter SQL files based on version
              filterTestFiles =
                version: dir:
                let
                  files = builtins.readDir dir;
                  # Get list of OrioleDB-specific test basenames, then strip the orioledb prefix from them
                  orioleDBVariants = pkgs.lib.pipe files [
                    builtins.attrNames
                    (builtins.filter (n: builtins.match "z_orioledb-17_.*\\.sql" n != null))
                    (map (n: builtins.substring 14 (pkgs.lib.stringLength n - 18) n)) # Remove "z_orioledb-17_" prefix (14 chars) and ".sql" suffix (4 chars)
                  ];
                  hasOrioleDBVariant = basename: builtins.elem basename orioleDBVariants;
                  isValidFile =
                    name:
                    let
                      isVersionSpecific = builtins.match "z_.*" name != null;
                      basename = builtins.substring 0 (pkgs.lib.stringLength name - 4) name; # Remove .sql
                      # Skip tests that don't work with OrioleDB
                      isSkippedForOrioleDB = isOrioleDB && builtins.elem basename orioleDBSkipTests;
                      matchesVersion =
                        if isSkippedForOrioleDB then
                          false
                        else if isVersionSpecific then
                          if isOrioleDB then
                            builtins.match "z_orioledb-17_.*" name != null
                          else if version == "17" then
                            builtins.match "z_17_.*" name != null
                          else
                            builtins.match "z_15_.*" name != null
                        else
                        # For common tests: exclude if OrioleDB variant exists and we're running OrioleDB
                        if isOrioleDB && hasOrioleDBVariant basename then
                          false
                        else
                          true;
                    in
                    pkgs.lib.hasSuffix ".sql" name && matchesVersion;
                in
                pkgs.lib.filterAttrs (name: _: isValidFile name) files;

              # Filter SQL test files
              filteredSqlTests = filterTestFiles pgpkg.version ./tests/sql;

              # Tests to skip for CLI variants (require extensions not in CLI)
              cliSkipTests = [
                # Extension-specific tests
                "evtrigs"
                "http"
                "hypopg"
                "index_advisor"
                "pg_hashids"
                "pg_jsonschema"
                "pg_partman"
                "pg_repack"
                "pg_tle"
                "pgtap"
                "pgmq"
                "pgroonga"
                "pgrouting"
                "plpgsql-check"
                "plv8"
                "postgis"
                "postgres_fdw"
                # Tests that depend on extensions not in CLI
                "security" # depends on various extensions
                "extensions_schema" # tests extension loading
                "roles" # includes roles/schemas from extensions not in CLI (pgtle, pgmq, repack, topology)
                "pg_net_worker_privileges" # needs the authenticated/postgres roles from the full migrations, not present in the CLI prime file
                "pg_cron_trigger_privileges" # needs pg_cron + the postgres role and cron-schema grants from the full migrations, not in the CLI prime file
                "supautils_restrict_versions" # needs the postgres role + primed hstore from the full migrations/prime, not present in the CLI variant
                "amcheck" # needs the postgres/anon/authenticated/service_role roles and the default privileges from the full migrations, plus amcheck primed by prime.sql
                "output_plugin_libraries" # needs wal_level=logical + logical-decoding infra, not exercised in the CLI variant
                "btree_gist_nan" # needs btree_gist, not in the CLI prime file
                "hstore_copy_binary" # needs hstore
                # Version-specific extension tests
                "z_17_ext_interface"
                "z_17_pg_stat_monitor"
                "z_17_pgvector"
                "z_17_rum"
                "z_17_roles" # version-specific roles test, includes pgtle_admin
              ];

              # Convert filtered tests to a sorted list of basenames (without extension)
              testList = pkgs.lib.mapAttrsToList (
                name: _: builtins.substring 0 (pkgs.lib.stringLength name - 4) name
              ) filteredSqlTests;

              # Filter out CLI-incompatible tests if this is a CLI variant
              filteredTestList =
                if isCliVariant then
                  builtins.filter (test: !(builtins.elem test cliSkipTests)) testList
                else
                  testList;

              sortedTestList = builtins.sort (a: b: a < b) filteredTestList;

              # Concurrency/isolation specs run via pg_isolation_regress (the stock
              # PostgreSQL isolation tester). Specs live in tests/isolation/specs/,
              # expected output in tests/isolation/expected/. Add new spec names here.
              isolationSpecList = [
                "merge_serialization"
              ];
            in
            pkgs.writeShellApplication rec {
              name = "postgres-${pgpkg.version}-check-harness";
              bashOptions = [
                "nounset"
                "pipefail"
              ];
              runtimeInputs = with pkgs; [
                bash
                coreutils
                getkey-script
                netcat
                perl
                pg_isolation_regress
                pg_prove
                pg_regress
                pgpkg
                procps
                python3
                start-postgres-server-bin
                supabase-groonga
                which
              ];

              text = ''
                #shellcheck disable=SC1091
                source ${bashlog}
                #shellcheck disable=SC1091
                source ${pkgs.stdenv}/setup
                export PATH="${lib.makeBinPath runtimeInputs}:$PATH"

                export BASHLOG_FILE=1
                export BASHLOG_FILE_PATH=debug.log
                # Use a build-specific directory for coordination
                BUILD_TMP=$(mktemp -d)

                # Function to log command execution with stdout and stderr
                function log_cmd {
                  local cmd_name="$1"
                  shift
                  log debug "Executing: $cmd_name $*"
                  local exit_code=0
                  echo "\$ $cmd_name $*" >> debug.log

                  "$cmd_name" "$@" >> debug.log 2>&1 || exit_code=$?
                  log debug "Exit code: $exit_code"
                  return $exit_code
                }

                function on_exit {
                  local exit_code=$?
                  kill $HTTP_MOCK_PID 2>/dev/null || true
                  rm -rf "$BUILD_TMP"
                  if [ $exit_code -ne 0 ]; then
                    log error "An error occurred. Exit code: $exit_code"
                    log error "Debug logs:"
                    cat debug.log || log error "No debug.log file found"
                  fi
                }
                trap on_exit EXIT
                trap "" DEBUG

                function check_postgres_ready {
                  for i in {1..60}; do
                      if log_cmd pg_isready -h localhost -p ${pgPort} -U supabase_admin -q; then
                          log info "PostgreSQL is ready"
                          break
                      fi
                      sleep 1
                      if [ "$i" -eq 60 ]; then
                          log error "PostgreSQL failed to start"
                          exit 1
                      fi
                  done
                }

                # Start HTTP mock server for http extension tests
                export HTTP_MOCK_PORT_FILE="$BUILD_TMP/http-mock-port"

                log info "Starting HTTP mock server (will find free port)..."
                log_cmd ${pkgs.python3}/bin/python3 ${./tests/http-mock-server.py} &
                HTTP_MOCK_PID=$!

                # Clean up on exit

                # Wait for server to start and write port file
                for i in {1..10}; do
                  if [ -f "$HTTP_MOCK_PORT_FILE" ]; then
                    HTTP_MOCK_PORT=$(cat "$HTTP_MOCK_PORT_FILE")
                    log info "HTTP mock server started on port $HTTP_MOCK_PORT"
                    break
                  fi
                  sleep 1
                done

                if [ ! -f "$HTTP_MOCK_PORT_FILE" ]; then
                  log error "Failed to start HTTP mock server"
                  exit 1
                fi

                # Export the port for use in SQL tests
                export HTTP_MOCK_PORT

                #First we need to create a generic pg cluster for pgtap tests and run those
                export GRN_PLUGINS_DIR=${pkgs.supabase-groonga}/lib/groonga/plugins
                PGTAP_CLUSTER=$(mktemp -d)
                log info "Creating temporary PostgreSQL cluster at $PGTAP_CLUSTER"
                log_cmd initdb --locale=C --username=supabase_admin -D "$PGTAP_CLUSTER"

                # Generate preload libraries list dynamically from receipt.json
                PRELOAD_LIBRARIES=$(${generatePreloadLibs} ${pgpkg}/receipt.json)
                log info "Generated preload libraries: $PRELOAD_LIBRARIES"

                substitute ${./tests/postgresql.conf.in} "$PGTAP_CLUSTER"/postgresql.conf \
                  --subst-var-by PGSODIUM_GETKEY_SCRIPT "${getkey-script}/bin/pgsodium-getkey" \
                  --subst-var-by PRELOAD_LIBRARIES "$PRELOAD_LIBRARIES"

                # Check if postgresql.conf exists
                if [ ! -f "$PGTAP_CLUSTER/postgresql.conf" ]; then
                  log error "postgresql.conf is missing!"
                  exit 1
                fi

                {
                  echo "listen_addresses = '127.0.0.1'"
                  echo "port = ${pgPort}"

                  echo "dynamic_library_path = '${supautils}/lib:\$libdir'"
                  echo "output_plugin_libraries = 'pgoutput, test_decoding, wal2json'"
                  echo "session_preload_libraries = 'supautils'"
                } >> "$PGTAP_CLUSTER"/postgresql.conf

                # Configure OrioleDB if running orioledb-17 check
                if ${lib.boolToString isOrioleDB}; then
                  log info "Configuring OrioleDB..."

                  # Add orioledb to shared_preload_libraries
                  perl -pi -e "s/(shared_preload_libraries = ')/\$1orioledb, /" "$PGTAP_CLUSTER/postgresql.conf"
                  log info "OrioleDB added to shared_preload_libraries"
                fi

                log info "Checking shared_preload_libraries setting:"
                log info "$(grep -rn "shared_preload_libraries" "$PGTAP_CLUSTER"/postgresql.conf)"

                log info "Configuring local auth"
                echo "host all all 127.0.0.1/32 trust" >> "$PGTAP_CLUSTER/pg_hba.conf"

                # PostgreSQL startup
                if [[ "$(uname)" == "Darwin" ]]; then
                  log_cmd pg_ctl -D "$PGTAP_CLUSTER" -l "$PGTAP_CLUSTER/postgresql.log" -o "-k $PGTAP_CLUSTER -p ${pgPort} -d 5" start
                else
                  mkdir -p "$PGTAP_CLUSTER/sockets"
                  log_cmd pg_ctl -D "$PGTAP_CLUSTER" -l "$PGTAP_CLUSTER/postgresql.log" -o "-k $PGTAP_CLUSTER/sockets -p ${pgPort} -d 5" start
                fi || {
                  log error "pg_ctl failed to start PostgreSQL"
                  log error "Contents of postgresql.log:"
                  cat "$PGTAP_CLUSTER"/postgresql.log
                  exit 1
                }

                log info "Waiting for PostgreSQL to be ready..."
                check_postgres_ready

                log info "Creating test database"
                log_cmd createdb -p ${pgPort} -h localhost --username=supabase_admin testing

                # Create orioledb extension if running orioledb-17 check (before prime.sql)
                if ${lib.boolToString isOrioleDB}; then
                  log info "Creating orioledb extension..."
                  log_cmd psql -p ${pgPort} -h localhost --username=supabase_admin -d testing -c "CREATE EXTENSION IF NOT EXISTS orioledb;"
                fi

                # Check if this is a CLI variant (passed as parameter)
                if ${lib.boolToString isCliVariant}; then
                  log info "CLI variant detected - loading CLI prime SQL file"
                  if ! log_cmd psql -p ${pgPort} -h localhost --username=supabase_admin -d testing -v ON_ERROR_STOP=1 -Xf ${./tests/prime-cli.sql}; then
                    log error "Error executing CLI prime SQL file. PostgreSQL log content:"
                    cat "$PGTAP_CLUSTER"/postgresql.log
                    pg_ctl -D "$PGTAP_CLUSTER" stop
                    exit 1
                  fi
                else
                  log info "Loading prime SQL file (full extension set)"
                  if ! log_cmd psql -p ${pgPort} -h localhost --username=supabase_admin -d testing -v ON_ERROR_STOP=1 -Xf ${./tests/prime.sql}; then
                    log error "Error executing SQL file. PostgreSQL log content:"
                    cat "$PGTAP_CLUSTER"/postgresql.log
                    pg_ctl -D "$PGTAP_CLUSTER" stop
                    exit 1
                  fi
                  log info "Loading prime-superuser SQL file (extensions excluded from supautils privileged list)"
                  if ! log_cmd psql -p ${pgPort} -h localhost --username=supabase_admin -d testing -v ON_ERROR_STOP=1 -Xf ${./tests/prime-superuser.sql}; then
                    log error "Error executing prime-superuser SQL file. PostgreSQL log content:"
                    cat "$PGTAP_CLUSTER"/postgresql.log
                    pg_ctl -D "$PGTAP_CLUSTER" stop
                    exit 1
                  fi
                fi

                # Create a table to store test configuration
                log info "Creating test_config table"
                log_cmd psql -p ${pgPort} -h localhost --username=supabase_admin -d testing -c "
                  CREATE TABLE IF NOT EXISTS test_config (key TEXT PRIMARY KEY, value TEXT);
                  INSERT INTO test_config (key, value) VALUES ('http_mock_port', '$HTTP_MOCK_PORT')
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                  INSERT INTO test_config (key, value) VALUES ('http_mock_host', 'localhost')
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                "
                SORTED_DIR=$(mktemp -d)
                for t in $(printf "%s\n" ${builtins.concatStringsSep " " sortedTestList}); do
                  log info "Running pgtap test: $t.sql"
                  #XXX enable ON_ERROR_STOP ?
                  log_cmd psql -p ${pgPort} -h localhost --username=supabase_admin -d testing -f "${./tests/sql}/$t.sql"
                done
                rm -rf "$SORTED_DIR"
                log_cmd pg_ctl -D "$PGTAP_CLUSTER" stop
                rm -rf "$PGTAP_CLUSTER"

                # End of pgtap tests
                # from here on out we are running pg_regress tests, we use a different cluster for this
                # which is start by the start-postgres-server-bin script
                # start-postgres-server-bin script closely matches our AMI setup, configurations and migrations

                log info "Starting PostgreSQL server for pg_regress tests"
                unset GRN_PLUGINS_DIR
                if ! log_cmd ${start-postgres-server-bin}/bin/start-postgres-server ${pgpkg.version} --daemonize; then
                  log error "Failed to start PostgreSQL server for pg_regress tests"
                  exit 1
                fi

                check_postgres_ready

                # Create orioledb extension if running orioledb-17 check (before prime.sql)
                if ${lib.boolToString isOrioleDB}; then
                  log info "Creating orioledb extension for pg_regress tests..."
                  log_cmd psql -p ${pgPort} -h localhost --no-password --username=supabase_admin -d postgres -c "CREATE EXTENSION IF NOT EXISTS orioledb;"
                fi

                # Check if this is a CLI variant (passed as parameter)
                if ${lib.boolToString isCliVariant}; then
                  log info "CLI variant detected - loading CLI prime SQL file"
                  if ! log_cmd psql -p ${pgPort} -h localhost --no-password --username=supabase_admin -d postgres -v ON_ERROR_STOP=1 -Xf ${./tests/prime-cli.sql} 2>&1; then
                    log error "Error executing CLI prime SQL file"
                    exit 1
                  fi
                else
                  log info "Loading prime SQL file (full extension set)"
                  if ! log_cmd psql -p ${pgPort} -h localhost --no-password --username=supabase_admin -d postgres -v ON_ERROR_STOP=1 -Xf ${./tests/prime.sql} 2>&1; then
                    log error "Error executing SQL file"
                    exit 1
                  fi
                  log info "Loading prime-superuser SQL file (extensions excluded from supautils privileged list)"
                  if ! log_cmd psql -p ${pgPort} -h localhost --no-password --username=supabase_admin -d postgres -v ON_ERROR_STOP=1 -Xf ${./tests/prime-superuser.sql} 2>&1; then
                    log error "Error executing prime-superuser SQL file"
                    exit 1
                  fi
                fi

                # Create a table to store test configuration for pg_regress tests
                log info "Creating test_config table for pg_regress tests"
                log_cmd psql -p ${pgPort} -h localhost --no-password --username=supabase_admin -d postgres -c "
                  CREATE TABLE IF NOT EXISTS test_config (key TEXT PRIMARY KEY, value TEXT);
                  INSERT INTO test_config (key, value) VALUES ('http_mock_port', '$HTTP_MOCK_PORT')
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                  INSERT INTO test_config (key, value) VALUES ('http_mock_host', 'localhost')
                  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                "

                #shellcheck disable=SC2154
                mkdir -p "$out/regression_output"

                # Check if this is a CLI variant and log appropriately
                if ${lib.boolToString isCliVariant}; then
                  log info "CLI variant detected - running subset of pg_regress tests (${builtins.toString (builtins.length sortedTestList)} tests)"
                else
                  log info "Running pg_regress tests (${builtins.toString (builtins.length sortedTestList)} tests)"
                fi

                if ! log_cmd pg_regress \
                  --use-existing \
                  --dbname=postgres \
                  --inputdir=${./tests} \
                  --outputdir="$out/regression_output" \
                  --host=localhost \
                  --port=${pgPort} \
                  --user=supabase_admin \
                  ${builtins.concatStringsSep " " sortedTestList} 2>&1; then
                  log error "pg_regress tests failed"
                  cat "$out/regression_output/regression.diffs"
                  exit 1
                fi
                log info "pg_regress tests completed successfully"

                # Isolation (concurrency) tests via pg_isolation_regress -- the stock
                # PostgreSQL isolation tester shipped in the build. Reuses the same
                # running server as pg_regress (--use-existing). These specs target
                # core/heap + contrib concurrency behaviour. Skipped on:
                #   - CLI variants: portable build runs only a test subset.
                #   - orioledb ships its own isolation suite for its storage-engine concurrency semantics.
                if ${lib.boolToString isCliVariant}; then
                  log info "CLI variant detected - skipping isolation tests"
                elif ${lib.boolToString isOrioleDB}; then
                  log info "orioledb variant detected - skipping isolation tests (orioledb has its own isolation suite)"
                else
                  log info "Running pg_isolation_regress tests (${builtins.toString (builtins.length isolationSpecList)} specs)"
                  mkdir -p "$out/isolation_output"
                  if ! log_cmd pg_isolation_regress \
                    --use-existing \
                    --dbname=postgres \
                    --inputdir=${./tests/isolation} \
                    --outputdir="$out/isolation_output" \
                    --host=localhost \
                    --port=${pgPort} \
                    --user=supabase_admin \
                    ${builtins.concatStringsSep " " isolationSpecList} 2>&1; then
                    log error "pg_isolation_regress tests failed"
                    cat "$out/isolation_output/output_iso/regression.diffs" 2>/dev/null || cat "$out/isolation_output/regression.diffs" 2>/dev/null || true
                    exit 1
                  fi
                  log info "pg_isolation_regress tests completed successfully"
                fi

                # Skip migrations tests for CLI variants (they may depend on extensions)
                if ${lib.boolToString isCliVariant}; then
                  log info "CLI variant detected - skipping migrations tests"
                else
                  log info "Running migrations tests"
                  log_cmd pg_prove -p ${pgPort} -U supabase_admin -h localhost -d postgres -v ${../migrations/tests}/test.sql
                  log info "Migrations tests completed successfully"
                fi
              '';
            };
        in
        {
          psql_15 = pkgs.runCommand "run-check-harness-psql-15" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_15/bin" { })
          );
          psql_17 = pkgs.runCommand "run-check-harness-psql-17" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_17/bin" { })
          );
          psql_orioledb-17 = pkgs.runCommand "run-check-harness-psql-orioledb-17" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_orioledb-17/bin" { })
          );
          psql_15_slim = pkgs.runCommand "run-check-harness-psql-15-slim" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_15_slim/bin" { isSlim = true; })
          );
          psql_17_slim = pkgs.runCommand "run-check-harness-psql-17-slim" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_17_slim/bin" { isSlim = true; })
          );
          psql_orioledb-17_slim = pkgs.runCommand "run-check-harness-psql-orioledb-17-slim" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_orioledb-17_slim/bin" { isSlim = true; })
          );
          # CLI variant checks
          psql_17_cli = pkgs.runCommand "run-check-harness-psql-17-cli" { } (
            lib.getExe (makeCheckHarness self'.packages."psql_17_cli/bin" { isCliVariant = true; })
          );
          # Portable CLI bundle portability checks
          psql_17_cli_portable =
            pkgs.runCommand "psql_17_cli_portable-portability-check"
              {
                nativeBuildInputs = [
                  pkgs.file
                ]
                ++ (
                  if pkgs.stdenv.isDarwin then
                    [ pkgs.darwin.cctools ]
                  else
                    [
                      pkgs.patchelf
                      pkgs.binutils
                    ]
                );
              }
              ''
                cd ${self'.packages.psql_17_cli_portable}

                echo "=== Section 1: Checking binaries for /nix/store references ==="
                for bin in bin/.*-wrapped; do
                  if [ -f "$bin" ]; then
                    ${
                      if pkgs.stdenv.isDarwin then
                        ''
                          if otool -L "$bin" 2>/dev/null | grep -q '/nix/store'; then
                            echo "ERROR: Found /nix/store reference in $bin:"
                            otool -L "$bin"
                            exit 1
                          fi
                        ''
                      else
                        ''
                          if readelf -d "$bin" 2>/dev/null | grep -q '/nix/store'; then
                            echo "ERROR: Found /nix/store reference in $bin:"
                            readelf -d "$bin"
                            exit 1
                          fi
                        ''
                    }
                    echo "  ✓ $bin has no /nix/store references"
                  fi
                done

                echo ""
                echo "=== Section 2: Checking libraries for /nix/store references ==="
                for lib in lib/*.${if pkgs.stdenv.isDarwin then "dylib*" else "so*"}; do
                  if [ -f "$lib" ]; then
                    ${
                      if pkgs.stdenv.isDarwin then
                        ''
                          if otool -L "$lib" 2>/dev/null | grep -q '/nix/store'; then
                            echo "ERROR: Found /nix/store reference in $lib:"
                            otool -L "$lib"
                            exit 1
                          fi
                        ''
                      else
                        ''
                          if readelf -d "$lib" 2>/dev/null | grep -q '/nix/store'; then
                            echo "ERROR: Found /nix/store reference in $lib:"
                            readelf -d "$lib"
                            exit 1
                          fi
                        ''
                    }
                    echo "  ✓ $lib has no /nix/store references"
                  fi
                done

                echo ""
                echo "=== Section 3: Checking extension libraries for /nix/store references ==="
                for extlib in lib/postgresql/*.${if pkgs.stdenv.isDarwin then "dylib" else "so"}; do
                  if [ -f "$extlib" ]; then
                    ${
                      if pkgs.stdenv.isDarwin then
                        ''
                          if otool -L "$extlib" 2>/dev/null | grep -q '/nix/store'; then
                            echo "ERROR: Found /nix/store reference in $extlib:"
                            otool -L "$extlib"
                            exit 1
                          fi
                        ''
                      else
                        ''
                          if readelf -d "$extlib" 2>/dev/null | grep -q '/nix/store'; then
                            echo "ERROR: Found /nix/store reference in $extlib:"
                            readelf -d "$extlib"
                            exit 1
                          fi
                        ''
                    }
                    echo "  ✓ $extlib has no /nix/store references"
                  fi
                done

                echo ""
                echo "=== Section 4: Verifying bundled libraries include transitive dependencies ==="
                ${
                  if pkgs.stdenv.isDarwin then
                    ''
                      # Check for ICU transitive dependencies
                      if [ ! -f "lib/libicuuc.75.1.dylib" ]; then
                        echo "ERROR: Missing transitive dependency libicuuc.75.1.dylib"
                        exit 1
                      fi
                      echo "  ✓ Found lib/libicuuc.75.1.dylib"

                      if [ ! -f "lib/libicudata.75.1.dylib" ]; then
                        echo "ERROR: Missing transitive dependency libicudata.75.1.dylib"
                        exit 1
                      fi
                      echo "  ✓ Found lib/libicudata.75.1.dylib"
                    ''
                  else
                    ''
                      # Check for ICU transitive dependencies (Linux uses .so.75 without patch version)
                      if [ ! -f "lib/libicuuc.so.75" ]; then
                        echo "ERROR: Missing transitive dependency libicuuc.so.75"
                        exit 1
                      fi
                      echo "  ✓ Found lib/libicuuc.so.75"

                      if [ ! -f "lib/libicudata.so.75" ]; then
                        echo "ERROR: Missing transitive dependency libicudata.so.75"
                        exit 1
                      fi
                      echo "  ✓ Found lib/libicudata.so.75"
                    ''
                }

                echo ""
                echo "=== Section 5: Checking binary RPATH configuration ==="
                for bin in bin/.*-wrapped; do
                  if [ -f "$bin" ]; then
                    ${
                      if pkgs.stdenv.isDarwin then
                        ''
                          if ! otool -l "$bin" 2>/dev/null | grep -q '@executable_path/../lib'; then
                            echo "ERROR: Binary $bin missing correct RPATH"
                            otool -l "$bin"
                            exit 1
                          fi
                        ''
                      else
                        ''
                          if ! readelf -d "$bin" 2>/dev/null | grep -q 'ORIGIN/../lib'; then
                            echo "ERROR: Binary $bin missing correct RPATH"
                            readelf -d "$bin"
                            exit 1
                          fi
                        ''
                    }
                    echo "  ✓ $bin has correct RPATH"
                  fi
                done

                echo ""
                echo "=== Section 6: Checking library RPATH configuration ==="
                for lib in lib/*.${if pkgs.stdenv.isDarwin then "dylib*" else "so*"}; do
                  if [ -f "$lib" ] && file "$lib" | grep -q "${
                    if pkgs.stdenv.isDarwin then "Mach-O" else "ELF"
                  }"; then
                    ${
                      if pkgs.stdenv.isDarwin then
                        ''
                          if ! otool -l "$lib" 2>/dev/null | grep -q '@loader_path'; then
                            echo "ERROR: Library $lib missing correct RPATH"
                            otool -l "$lib"
                            exit 1
                          fi
                        ''
                      else
                        ''
                          if ! readelf -d "$lib" 2>/dev/null | grep -q 'ORIGIN'; then
                            echo "ERROR: Library $lib missing correct RPATH"
                            readelf -d "$lib"
                            exit 1
                          fi
                        ''
                    }
                    echo "  ✓ $lib has correct RPATH"
                  fi
                done

                echo ""
                ${lib.optionalString pkgs.stdenv.isLinux ''
                  echo "=== Section 7: Checking ELF interpreter for portability ==="

                  # Determine expected interpreter based on architecture
                  ARCH=$(uname -m)
                  if [ "$ARCH" = "x86_64" ]; then
                    EXPECTED_INTERP="/lib64/ld-linux-x86-64.so.2"
                  elif [ "$ARCH" = "aarch64" ]; then
                    EXPECTED_INTERP="/lib/ld-linux-aarch64.so.1"
                  else
                    echo "ERROR: Unsupported architecture $ARCH"
                    exit 1
                  fi

                  for bin in bin/.*-wrapped; do
                    if [ -f "$bin" ] && file "$bin" | grep -q ELF; then
                      # Check that interpreter is set to system path, not Nix store
                      INTERP=$(readelf -l "$bin" | grep "program interpreter" | sed -n 's/.*\[requesting: \(.*\)\]/\1/p' | tr -d ']')
                      if [ -z "$INTERP" ]; then
                        # Try alternative readelf output format
                        INTERP=$(readelf -l "$bin" | grep "interpreter" | sed -n 's/.*interpreter: \(.*\)]/\1/p')
                      fi

                      if echo "$INTERP" | grep -q '/nix/store'; then
                        echo "ERROR: Binary $bin has Nix store interpreter: $INTERP"
                        readelf -l "$bin" | grep -A 2 "program interpreter"
                        exit 1
                      fi

                      # Verify it's using the expected system dynamic linker for this architecture
                      if [ "$INTERP" != "$EXPECTED_INTERP" ]; then
                        echo "ERROR: Binary $bin has unexpected interpreter: $INTERP (expected: $EXPECTED_INTERP)"
                        readelf -l "$bin" | grep -A 2 "program interpreter"
                        exit 1
                      fi

                      echo "  ✓ $bin uses system interpreter: $INTERP"
                    fi
                  done
                  echo ""
                ''}
                echo "=== Section 8: Verifying wrapper scripts ==="
                for bin in bin/postgres bin/pg_config bin/pg_ctl bin/initdb bin/psql bin/pg_dump bin/pg_restore bin/createdb bin/dropdb; do
                  if [ -f "$bin" ]; then
                    if ! grep -q "#!/bin/bash" "$bin"; then
                      echo "ERROR: Wrapper $bin missing proper shebang"
                      head -n 1 "$bin"
                      exit 1
                    fi
                    if ! grep -q "NIX_PGLIBDIR" "$bin"; then
                      echo "ERROR: Wrapper $bin missing NIX_PGLIBDIR"
                      cat "$bin"
                      exit 1
                    fi
                    ${
                      if pkgs.stdenv.isDarwin then
                        ''
                          if ! grep -q "DYLD_LIBRARY_PATH" "$bin"; then
                            echo "ERROR: Wrapper $bin missing DYLD_LIBRARY_PATH"
                            cat "$bin"
                            exit 1
                          fi
                        ''
                      else
                        ''
                          if ! grep -q "LD_LIBRARY_PATH" "$bin"; then
                            echo "ERROR: Wrapper $bin missing LD_LIBRARY_PATH"
                            cat "$bin"
                            exit 1
                          fi
                        ''
                    }
                    echo "  ✓ $bin is a valid wrapper script"
                  fi
                done

                echo ""
                ${lib.optionalString pkgs.stdenv.isLinux ''
                  echo "=== Section 9: Verify system libraries are NOT bundled ==="
                  # Check that glibc and other core system libraries are NOT in lib/
                  SYSTEM_LIBS="libc.so libc-2 ld-linux libdl.so libpthread.so libm.so libresolv.so librt.so"
                  FOUND_SYSTEM_LIB=0
                  for syslib in $SYSTEM_LIBS; do
                    if find lib -name "$syslib*" 2>/dev/null | grep -q .; then
                      echo "ERROR: System library $syslib should NOT be bundled"
                      find lib -name "$syslib*" -ls
                      FOUND_SYSTEM_LIB=1
                    fi
                  done

                  if [ $FOUND_SYSTEM_LIB -eq 1 ]; then
                    exit 1
                  fi

                  echo "  ✓ No system libraries bundled (glibc, libdl, libpthread, libm)"
                  echo ""
                ''}
                echo "=== All portability checks passed! ==="
                touch $out
              '';
          inherit (self'.packages)
            cli-smoke-test
            docker-image-inputs
            docker-image-test
            goss
            image-size-analyzer
            pg_regress
            pg_isolation_regress
            pg-startup-profiler
            supabase-cli
            supascan
            wal-g-2
            wal-g-3
            ;
          devShell = self'.devShells.default;
        }
        // (import ./ext/tests {
          inherit self;
          inherit pkgs;
        })
        // pkgs.lib.optionalAttrs (pkgs.stdenv.isLinux) {
          inherit (self'.packages)
            postgresql_15_debug
            postgresql_15_src
            postgresql_orioledb-17_debug
            postgresql_orioledb-17_src
            postgresql_17_debug
            postgresql_17_src
            ;
          psql_orioledb-17_exts_orioledb_debug = self'.legacyPackages.psql_orioledb-17.exts.orioledb.debug;
        };
    };
}
