{ self, pkgs }:
let
  pname = "wrappers";
  system = pkgs.pkgsLinux.stdenv.hostPlatform.system;
  testLib = import ./lib.nix { inherit self pkgs; };

  pgUpgradeScripts = builtins.path {
    path = ../../../ansible/files/admin_api_scripts/pg_upgrade_scripts;
    name = "pg_upgrade_scripts";
  };

  testsLibPy = pkgs.runCommand "extension-test-lib" { } ''
    module_dir="$out/${pkgs.python3.sitePackages}/pg_nix_test_lib"
    mkdir -p "$module_dir"
    cp ${./lib.py} "$module_dir/__init__.py"
    touch "$module_dir/py.typed"
  '';

  versions = builtins.toJSON { "15" = self.legacyPackages.${system}.psql_15.exts.${pname}.versions; };
in
pkgs.testers.runNixOSTest {
  name = "wrappers-regression-PSQL-1387";
  extraPythonPackages = _: [ testsLibPy ];
  nodes.server = {
    imports = [
      (testLib.makeSupabaseTestConfig {
        majorVersion = "15";
      })
    ];
  };
  testScript =
    { ... }:
    # python
    ''
      import json
      from pathlib import Path
      from pg_nix_test_lib import PostgresExtensionTest

      versions = json.loads("""${versions}""")
      sql_test_directory = Path("${../../tests}")

      start_all()
      server.wait_for_unit("supabase-db-init.service")

      test = PostgresExtensionTest(server, "${pname}", versions, sql_test_directory, True)

      with subtest("Prepare Regression Scenario"):
          last_version = test.check_install_last_version("15")
          test.run_sql("""
              CREATE EXTENSION postgres_fdw;
              CREATE SERVER wrappers_upgrade_test FOREIGN DATA WRAPPER postgres_fdw
              OPTIONS (host 'localhost');
          """)
          sql = "SELECT 1 FROM pg_foreign_server WHERE srvname = 'wrappers_upgrade_test';"
          assert test.run_sql(sql) == "1"

          # ensure supabase_vault is not enable, this is the error condition
          test.run_sql("DROP EXTENSION supabase_vault;")
          sql = "SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault';"
          assert test.run_sql(sql) != "1", "supabase_vault must be absent"

      with subtest("Check Patch Wrappers Without Vault"):
          server.succeed("${pgUpgradeScripts}/complete.sh execute_wrappers_patch")
    '';
}
