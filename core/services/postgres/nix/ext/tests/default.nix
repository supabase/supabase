{ self, pkgs }:
let
  testsDir = ./.;
  testFiles = builtins.attrNames (builtins.readDir testsDir);
  nixFiles = builtins.filter (
    name: builtins.match ".*\\.nix$" name != null && name != "default.nix" && name != "lib.nix"
  ) testFiles;
  extTest =
    extension_name:
    let
      pname = extension_name;
      inherit (pkgs) lib;

      support_upgrade = true;
      run_pg_regress = true;

      installedExtension =
        postgresMajorVersion:
        self.legacyPackages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}."psql_${postgresMajorVersion}".exts."${
          pname
        }";
      versions = postgresqlMajorVersion: (installedExtension postgresqlMajorVersion).versions;
      postgresqlWithExtension =
        postgresql:
        let
          majorVersion =
            if postgresql.isOrioleDB then "orioledb-17" else lib.versions.major postgresql.version;
          pkg = pkgs.pkgsLinux.buildEnv {
            name = "postgresql-${majorVersion}-${pname}";
            paths = [
              postgresql
              postgresql.lib
              (installedExtension majorVersion)
            ]
            ++ lib.optional (postgresql.isOrioleDB
            ) self.legacyPackages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}.psql_orioledb-17.exts.orioledb;
            passthru = {
              inherit (postgresql) version psqlSchema;
              lib = pkg;
              withPackages = _: pkg;
              withJIT = pkg;
              withoutJIT = pkg;
              installedExtensions = [ (installedExtension majorVersion) ];
            };
            nativeBuildInputs = [ pkgs.pkgsLinux.makeWrapper ];
            pathsToLink = [
              "/"
              "/bin"
              "/lib"
            ];
            postBuild = ''
              wrapProgram $out/bin/postgres --set NIX_PGLIBDIR $out/lib
              wrapProgram $out/bin/pg_ctl --set NIX_PGLIBDIR $out/lib
              wrapProgram $out/bin/pg_upgrade --set NIX_PGLIBDIR $out/lib
            '';
          };
        in
        pkg;
      psql_15 =
        postgresqlWithExtension
          self.packages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}.postgresql_15;
      psql_17 =
        postgresqlWithExtension
          self.packages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}.postgresql_17;
      orioledb_17 =
        postgresqlWithExtension
          self.packages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}.postgresql_orioledb-17;
    in
    pkgs.testers.runNixOSTest {
      name = pname;
      nodes.server =
        { config, ... }:
        {
          # VM resources — sized for nested virtualisation on ephemeral CI runners
          virtualisation.memorySize = 4096;
          virtualisation.cores = 2;

          services.openssh = {
            enable = true;
          };

          services.postgresql = {
            enable = true;
            package = psql_15;
            enableTCPIP = true;
            authentication = ''
              local all postgres peer map=postgres
              local all all peer map=root
            '';
            identMap = ''
              root root supabase_admin
              postgres postgres postgres
            '';
            ensureUsers = [
              {
                name = "supabase_admin";
                ensureClauses.superuser = true;
              }
            ];
            settings = (installedExtension "15").defaultSettings or { };
          };

          networking.firewall.allowedTCPPorts = [ config.services.postgresql.settings.port ];

          specialisation.postgresql17.configuration = {
            services.postgresql = {
              package = lib.mkForce psql_17;
              settings = (installedExtension "17").defaultSettings or { };
            };

            systemd.services.postgresql-migrate = {
              serviceConfig = {
                Type = "oneshot";
                RemainAfterExit = true;
                User = "postgres";
                Group = "postgres";
                StateDirectory = "postgresql";
                WorkingDirectory = "${builtins.dirOf config.services.postgresql.dataDir}";
              };
              script =
                let
                  oldPostgresql = psql_15;
                  newPostgresql = psql_17;
                  oldDataDir = "${builtins.dirOf config.services.postgresql.dataDir}/${oldPostgresql.psqlSchema}";
                  newDataDir = "${builtins.dirOf config.services.postgresql.dataDir}/${newPostgresql.psqlSchema}";
                in
                ''
                  if [[ ! -d ${newDataDir} ]]; then
                    install -d -m 0700 -o postgres -g postgres "${newDataDir}"
                    ${newPostgresql}/bin/initdb -D "${newDataDir}"
                    ${newPostgresql}/bin/pg_upgrade --old-datadir "${oldDataDir}" --new-datadir "${newDataDir}" \
                      --old-bindir "${oldPostgresql}/bin" --new-bindir "${newPostgresql}/bin" \
                      ${
                        if config.services.postgresql.settings.shared_preload_libraries != null then
                          " --old-options='-c shared_preload_libraries=${config.services.postgresql.settings.shared_preload_libraries}' --new-options='-c shared_preload_libraries=${config.services.postgresql.settings.shared_preload_libraries}'"
                        else
                          ""
                      }
                  else
                    echo "${newDataDir} already exists"
                  fi
                '';
            };

            systemd.services.postgresql = {
              after = [ "postgresql-migrate.service" ];
              requires = [ "postgresql-migrate.service" ];
            };
          };

          specialisation.orioledb17.configuration = {
            services.postgresql = {
              package = lib.mkForce (
                postgresqlWithExtension
                  self.packages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}.postgresql_orioledb-17
              );
              settings = lib.mkForce (
                ((installedExtension "17").defaultSettings or { })
                // {
                  jit = "off";
                  shared_preload_libraries = [
                    "orioledb"
                  ]
                  ++ (lib.toList ((installedExtension "17").defaultSettings.shared_preload_libraries or [ ]));
                  default_table_access_method = "orioledb";
                  # orioledb-17 is pinned to 17.11+, which added output_plugin_libraries
                  # as an allow-list for logical decoding output plugins.
                  output_plugin_libraries = "pgoutput, test_decoding, wal2json";
                }
              );
              initdbArgs = [
                "--allow-group-access"
                "--locale-provider=icu"
                "--encoding=UTF-8"
                "--icu-locale=en_US.UTF-8"
              ];
              initialScript = pkgs.writeText "init-postgres-with-orioledb" ''
                CREATE EXTENSION orioledb CASCADE;
              '';
            };

            systemd.services.postgresql-migrate = {
              # we don't support migrating from postgresql 17 to orioledb-17 so we just reinit the datadir
              serviceConfig = {
                Type = "oneshot";
                RemainAfterExit = true;
                User = "postgres";
                Group = "postgres";
                StateDirectory = "postgresql";
                WorkingDirectory = "${builtins.dirOf config.services.postgresql.dataDir}";
              };
              script =
                let
                  newPostgresql =
                    postgresqlWithExtension
                      self.packages.${pkgs.pkgsLinux.stdenv.hostPlatform.system}.postgresql_orioledb-17;
                in
                ''
                  if [[ -z "${newPostgresql.psqlSchema}" ]]; then
                    echo "Error: psqlSchema is empty, refusing to rm -rf"
                    exit 1
                  fi
                  rm -rf ${builtins.dirOf config.services.postgresql.dataDir}/${newPostgresql.psqlSchema}
                '';
            };

            systemd.services.postgresql = {
              after = [ "postgresql-migrate.service" ];
              requires = [ "postgresql-migrate.service" ];
            };
          };
        };
      testScript =
        { nodes, ... }:
        let
          pg17-configuration = "${nodes.server.system.build.toplevel}/specialisation/postgresql17";
          orioledb17-configuration = "${nodes.server.system.build.toplevel}/specialisation/orioledb17";
        in
        ''
          from pathlib import Path
          import json
          versions = {
            "15": [${lib.concatStringsSep ", " (map (s: ''"${s}"'') (versions "15"))}],
            "17": [${lib.concatStringsSep ", " (map (s: ''"${s}"'') (versions "17"))}],
            "orioledb-17": [${lib.concatStringsSep ", " (map (s: ''"${s}"'') (versions "orioledb-17"))}],
          }
          extension_name = "${pname}"
          support_upgrade = ${if support_upgrade then "True" else "False"}
          pg17_configuration = "${pg17-configuration}"
          ext_has_background_worker = ${
            if support_upgrade && (installedExtension "15") ? hasBackgroundWorker then "True" else "False"
          }
          sql_test_directory = Path("${../../tests}")
          pg_regress_test_name = "${(installedExtension "15").pgRegressTestName or pname}"
          ext_schema = "${(installedExtension "15").defaultSchema or "public"}"
          lib_name = "${(installedExtension "15").libName or pname}"
          legacy_versions = json.loads('${builtins.toJSON ((installedExtension "15").legacyVersions or { })}')
          print(f"Running tests for extension: {lib_name}")

          ${builtins.readFile ./lib.py}

          start_all()

          server.wait_for_unit("multi-user.target")
          server.wait_for_unit("postgresql.service")

          test = PostgresExtensionTest(server, extension_name, versions, sql_test_directory, support_upgrade, ext_schema, lib_name)
          test.create_schema()

          ${
            if support_upgrade then
              ''
                with subtest("Check upgrade path with postgresql 15"):
                  test.check_upgrade_path("15")

                if legacy_versions:
                  with subtest("Check legacy extversion strings upgrade to latest with postgresql 15"):
                    test.check_legacy_versions_upgrade_to_latest("15", legacy_versions)
              ''
            else
              ""
          }

          ${
            if run_pg_regress then
              ''
                with subtest("Check pg_regress with postgresql 15 after extension upgrade"):
                  test.check_pg_regress(Path("${psql_15}/lib/pgxs/src/test/regress/pg_regress"), "15", pg_regress_test_name)
              ''
            else
              ""
          }

          last_version = None
          with subtest("Check the install of the last version of the extension"):
            last_version = test.check_install_last_version("15")

          ${
            if support_upgrade then
              ''
                if ext_has_background_worker:
                  with subtest("Test switch_${pname}_version"):
                    test.check_switch_extension_with_background_worker(Path(f"${psql_15}/lib/{lib_name}.so"), "15")

                  with subtest("Check pg_regress with postgresql 15 after installing the last version"):
                    test.check_pg_regress(Path("${psql_15}/lib/pgxs/src/test/regress/pg_regress"), "15", pg_regress_test_name)
              ''
            else
              ""
          }

          has_update_script = False
          with subtest("switch to postgresql 17"):
            server.execute(
              "${pg17-configuration}/bin/switch-to-configuration test >&2"
            )
            server.wait_for_unit("postgresql.service")
            has_update_script = server.succeed(
              "test -f /var/lib/postgresql/update_extensions.sql && echo 'yes' || echo 'no'"
            ).strip() == "yes"
            if has_update_script:
              # Run the extension update script generated during the upgrade
              test.run_sql_file("/var/lib/postgresql/update_extensions.sql")

          with subtest("Check last version of the extension after postgresql upgrade"):
            if has_update_script:
              # If there was an update script, the last version should be installed
              test.assert_version_matches(versions["17"][-1])
            else:
              # Otherwise, the version should match the last version from postgresql 15
              test.assert_version_matches(last_version)

          ${
            if support_upgrade then
              ''
                with subtest("Check upgrade path with postgresql 17"):
                  test.check_upgrade_path("17")

                if legacy_versions:
                  with subtest("Check legacy extversion strings upgrade to latest with postgresql 17"):
                    test.check_legacy_versions_upgrade_to_latest("17", legacy_versions)
              ''
            else
              ""
          }

          ${
            if run_pg_regress then
              ''
                with subtest("Check pg_regress with postgresql 17 after extension upgrade"):
                  test.check_pg_regress(Path("${psql_17}/lib/pgxs/src/test/regress/pg_regress"), "17", pg_regress_test_name)

                with subtest("Check the install of the last version of the extension"):
                  test.check_install_last_version("17")

                with subtest("Check pg_regress with postgresql 17 after installing the last version"):
                  test.check_pg_regress(Path("${psql_17}/lib/pgxs/src/test/regress/pg_regress"), "17", pg_regress_test_name)

                with subtest("switch to orioledb 17"):
                  server.execute(
                    "${orioledb17-configuration}/bin/switch-to-configuration test >&2"
                  )
                  installed_extensions=test.run_sql("""SELECT extname FROM pg_extension WHERE extname = 'orioledb';""")
                  assert "orioledb" in installed_extensions
                  test.create_schema()

                with subtest("Check upgrade path with orioledb 17"):
                  test.check_upgrade_path("orioledb-17")

                if legacy_versions:
                  with subtest("Check legacy extversion strings upgrade to latest with orioledb 17"):
                    test.check_legacy_versions_upgrade_to_latest("orioledb-17", legacy_versions)

                with subtest("Check pg_regress with orioledb 17 after installing the last version"):
                  test.check_pg_regress(Path("${orioledb_17}/lib/pgxs/src/test/regress/pg_regress"), "orioledb-17", pg_regress_test_name)
              ''
            else
              ""
          }
        '';
    };
in
builtins.listToAttrs (
  map (file: {
    name = "ext-" + builtins.replaceStrings [ ".nix" ] [ "" ] file;
    value = import (testsDir + "/${file}") { inherit self pkgs; };
  }) nixFiles
)
// builtins.listToAttrs (
  map
    (extName: {
      name = "ext-${extName}";
      value = extTest extName;
    })
    [
      "hypopg"
      "pg_cron"
      "pg_graphql"
      "pg_hashids"
      "pg_jsonschema"
      "pg_net"
      "pg_partman"
      "pg_stat_monitor"
      "pg_tle"
      "pgaudit"
      "pgtap"
      "vector"
      "wal2json"
      "wrappers"
    ]
)
