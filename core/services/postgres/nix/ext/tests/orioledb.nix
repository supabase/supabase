{ self, pkgs }:
let
  pname = "orioledb";
  testLib = import ./lib.nix { inherit self pkgs; };
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

      specialisation.orioledb17.configuration = testLib.makeOrioledbSpecialisation { };
    };
  testScript =
    { nodes, ... }:
    let
      orioledb17-configuration = "${nodes.server.system.build.toplevel}/specialisation/orioledb17";
    in
    ''
      orioledb17_configuration = "${orioledb17-configuration}"

      start_all()

      # Wait for full Supabase initialization on PG 15
      server.wait_for_unit("supabase-db-init.service")

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

        dam = server.succeed(
          "psql -U supabase_admin -d postgres -t -A -c \"SHOW default_table_access_method;\""
        ).strip()
        assert dam == "orioledb", (
          f"Expected default_table_access_method = orioledb, got: {dam}"
        )

      with subtest("Verify OrioleDB init scripts and migrations ran"):
        roles = server.succeed(
          "psql -U supabase_admin -d postgres -t -A -c \"SELECT rolname FROM pg_roles ORDER BY rolname;\""
        ).strip()
        for role in ["anon", "authenticated", "authenticator", "supabase_admin"]:
          assert role in roles, f"Expected role {role} to exist, got: {roles}"
    '';
}
