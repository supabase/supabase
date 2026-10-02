{ ... }:
{
  perSystem =
    { self', lib, ... }:
    let
      mkApp = attrName: {
        type = "app";
        program = lib.getExe self'.packages."${attrName}";
      };
    in
    {
      # Apps is a list of names of things that can be executed with 'nix run';
      # these are distinct from the things that can be built with 'nix build',
      # so they need to be listed here too.
      apps = {
        start-server = mkApp "start-server";
        start-client = mkApp "start-client";
        start-replica = mkApp "start-replica";
        # migrate-postgres = mkApp "migrate-tool";
        # sync-exts-versions = mkApp "sync-exts-versions";
        pg-restore = mkApp "pg-restore";
        local-infra-bootstrap = mkApp "local-infra-bootstrap";
        dbmate-tool = mkApp "dbmate-tool";
        image-size-analyzer = mkApp "image-size-analyzer";
        update-readme = mkApp "update-readme";
        show-commands = mkApp "show-commands";
        build-test-ami = mkApp "build-test-ami";
        run-testinfra = mkApp "run-testinfra";
        cleanup-ami = mkApp "cleanup-ami";
        trigger-nix-build = mkApp "trigger-nix-build";
        supascan = mkApp "supascan";
        pg-startup-profiler = mkApp "pg-startup-profiler";
        docker-image-test = mkApp "docker-image-test";
        cli-smoke-test = mkApp "cli-smoke-test";
      };
    };
}
