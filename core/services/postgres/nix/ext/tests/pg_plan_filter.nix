# plan_filter is a shared-library-only module, not a CREATE EXTENSION type
# extension. It's loaded via shared_preload_libraries and configured via GUC
# parameters (plan_filter.statement_cost_limit, plan_filter.limit_select_only).
# See: https://github.com/pgexperts/pg_plan_filter
{ self, pkgs }:
let
  testLib = import ./lib.nix { inherit self pkgs; };
in
pkgs.testers.runNixOSTest {
  name = "plan_filter";
  nodes.server =
    { ... }:
    {
      imports = [
        (testLib.makeSupabaseTestConfig {
          majorVersion = "15";
        })
      ];

      specialisation.postgresql17.configuration = testLib.makeUpgradeSpecialisation {
        fromMajorVersion = "15";
        toMajorVersion = "17";
      };

      specialisation.orioledb17.configuration = testLib.makeOrioledbSpecialisation { };
    };
  testScript =
    { nodes, ... }:
    let
      pg17-configuration = "${nodes.server.system.build.toplevel}/specialisation/postgresql17";
      orioledb17-configuration = "${nodes.server.system.build.toplevel}/specialisation/orioledb17";
    in
    ''
      pg17_configuration = "${pg17-configuration}"
      orioledb17_configuration = "${orioledb17-configuration}"

      def check_plan_filter(server):
        """Verify plan_filter is loaded and its GUC parameters are functional."""
        spl = server.succeed(
          "psql -U supabase_admin -d postgres -t -A -c \"SHOW shared_preload_libraries;\""
        ).strip()
        assert "plan_filter" in spl, (
          f"Expected plan_filter in shared_preload_libraries, got: {spl}"
        )

        # Verify GUC parameter is registered (default: 0 = no filter)
        cost_limit = server.succeed(
          "psql -U supabase_admin -d postgres -t -A -c \"SHOW plan_filter.statement_cost_limit;\""
        ).strip()
        assert cost_limit is not None, "plan_filter.statement_cost_limit GUC not available"

        # Verify the parameter can be set
        server.succeed(
          "psql -U supabase_admin -d postgres -c \"SET plan_filter.statement_cost_limit = 100000.0;\""
        )

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

      with subtest("Verify plan_filter is loaded on PostgreSQL 15"):
        check_plan_filter(server)

      with subtest("switch to postgresql 17"):
        server.execute(
          f"{pg17_configuration}/bin/switch-to-configuration test >&2"
        )
        server.wait_for_unit("postgresql.service")

      with subtest("Verify PostgreSQL 17 is our custom build"):
        pg_version = server.succeed(
          "psql -U supabase_admin -d postgres -t -A -c \"SELECT version();\""
        ).strip()
        assert "${testLib.expectedVersions."17"}" in pg_version, (
          f"Expected version ${testLib.expectedVersions."17"}, got: {pg_version}"
        )

      with subtest("Verify plan_filter is loaded on PostgreSQL 17"):
        check_plan_filter(server)

      with subtest("switch to orioledb 17"):
        server.execute(
          f"{orioledb17_configuration}/bin/switch-to-configuration test >&2"
        )
        server.wait_for_unit("supabase-db-init.service")

      with subtest("Verify OrioleDB is running"):
        installed_extensions = server.succeed(
          "psql -U supabase_admin -d postgres -t -A -c \"SELECT extname FROM pg_extension WHERE extname = 'orioledb';\""
        ).strip()
        assert "orioledb" in installed_extensions, (
          f"Expected orioledb extension to be installed, got: {installed_extensions}"
        )

      with subtest("Verify plan_filter is loaded on OrioleDB"):
        check_plan_filter(server)
    '';
}
