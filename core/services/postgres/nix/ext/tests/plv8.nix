# plv8 only supports PostgreSQL 15 (not PG 17 or OrioleDB)
{ self, pkgs }:
let
  pname = "plv8";
  inherit (pkgs) lib;
  system = pkgs.pkgsLinux.stdenv.hostPlatform.system;
  testLib = import ./lib.nix { inherit self pkgs; };

  installedExtension =
    postgresMajorVersion: self.legacyPackages.${system}."psql_${postgresMajorVersion}".exts."${pname}";
  versions = postgresqlMajorVersion: (installedExtension postgresqlMajorVersion).versions;
in
pkgs.testers.runNixOSTest {
  name = pname;
  nodes.server =
    { ... }:
    {
      imports = [
        (testLib.makeSupabaseTestConfig {
          majorVersion = "15";
        })
      ];
    };
  testScript = ''
    from pathlib import Path
    versions = {
      "15": [${lib.concatStringsSep ", " (map (s: ''"${s}"'') (versions "15"))}],
    }
    extension_name = "${pname}"
    support_upgrade = False
    sql_test_directory = Path("${../../tests}")

    ${builtins.readFile ./lib.py}

    start_all()

    # Wait for full Supabase initialization (postgres + init-scripts + migrations)
    server.wait_for_unit("supabase-db-init.service")

    with subtest("Verify PostgreSQL 15 is our custom build"):
      pg_version = server.succeed(
        "psql -U supabase_admin -d postgres -t -A -c \"SELECT version();\""
      ).strip()
      assert "${testLib.expectedVersions."15"}" in pg_version, (
        f"Expected version ${testLib.expectedVersions."15"}, got: {pg_version}"
      )

      postgres_path = server.succeed("readlink -f $(which postgres)").strip()
      assert "postgresql-and-plugins-${testLib.expectedVersions."15"}" in postgres_path, (
        f"Expected our custom build (${testLib.expectedVersions."15"}), got: {postgres_path}"
      )

    with subtest("Verify ansible config loaded"):
      spl = server.succeed(
        "psql -U supabase_admin -d postgres -t -A -c \"SHOW shared_preload_libraries;\""
      ).strip()
      for ext in ["pg_stat_statements", "pgaudit", "pgsodium", "pg_cron", "pg_net"]:
        assert ext in spl, f"Expected {ext} in shared_preload_libraries, got: {spl}"

      session_pl = server.succeed(
        "psql -U supabase_admin -d postgres -t -A -c \"SHOW session_preload_libraries;\""
      ).strip()
      assert "supautils" in session_pl, (
        f"Expected supautils in session_preload_libraries, got: {session_pl}"
      )

    with subtest("Verify init scripts and migrations ran"):
      roles = server.succeed(
        "psql -U supabase_admin -d postgres -t -A -c \"SELECT rolname FROM pg_roles ORDER BY rolname;\""
      ).strip()
      for role in ["anon", "authenticated", "authenticator", "dashboard_user", "pgbouncer", "service_role", "supabase_admin", "supabase_auth_admin", "supabase_storage_admin"]:
        assert role in roles, f"Expected role {role} to exist, got: {roles}"

      schemas = server.succeed(
        "psql -U supabase_admin -d postgres -t -A -c \"SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;\""
      ).strip()
      for schema in ["auth", "storage", "extensions"]:
        assert schema in schemas, f"Expected schema {schema} to exist, got: {schemas}"

    test = PostgresExtensionTest(server, extension_name, versions, sql_test_directory, support_upgrade)

    with subtest("Check upgrade path with postgresql 15"):
      test.check_upgrade_path("15")

    with subtest("Check the install of the last version of the extension"):
      test.check_install_last_version("15")
  '';
}
