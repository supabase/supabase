{ ... }:
{
  perSystem =
    {
      pkgs,
      self',
      config,
      lib,
      ...
    }:
    let
      # Define pythonEnv here
      pythonEnv = pkgs.python3.withPackages (
        ps: with ps; [
          boto3
          docker
          pytest
          pytest-testinfra
          requests
          ec2instanceconnectcli
          paramiko
        ]
      );
      docvenv = pkgs.python3.buildEnv.override {
        extraLibs = self'.packages.docs.nativeBuildInputs;
      };
    in
    {
      devShells = {
        default = pkgs.devshell.mkShell {
          packages = with pkgs; [
            coreutils
            just
            nix-update
            #pg_prove
            shellcheck
            ansible
            ansible-lint
            aws-vault
            packer
            dbmate
            nushell
            pythonEnv
            config.treefmt.build.wrapper
            pre-commit
          ];
          devshell.startup.pre-commit.text = config.pre-commit.installationScript;
          commands = [
            {
              name = "fmt";
              help = "Format code";
              command = "nix fmt";
              category = "check";
            }
            {
              name = "check";
              help = "Run all checks";
              command = "nix flake -L check -v";
              category = "check";
            }
            {
              name = "lint";
              help = "Lint code";
              command = "pre-commit run --all-files";
              category = "check";
            }
            {
              name = "serve-nix-doc";
              help = "Spin up a server exposing the nix documentation";
              command = "pushd $(git rev-parse --show-toplevel)/nix && ${docvenv}/bin/mkdocs serve -o";
              category = "doc";
            }
            {
              name = "watch";
              help = "Watch for file changes and run all checks";
              command =
                let
                  watchExec = lib.getExe pkgs.watchexec;
                  nixFastBuild = ''
                    ${lib.getExe pkgs.nix} run github:Mic92/nix-fast-build -- \
                      --skip-cached --retries=2 --no-download --option warn-dirty false \
                      --option accept-flake-config true --no-link \
                      --flake ".#checks.${pkgs.stdenv.hostPlatform.system}"
                  '';
                in
                "${watchExec} --on-busy-update=queue -w . --ignore '.jj/*' --timings -- ${nixFastBuild}";
              category = "check";
            }
            {
              name = "cleanup-ami";
              help = "Deregister AMIs by name";
              command = "${lib.getExe self'.packages.cleanup-ami} $@";
              category = "ami";
            }
            {
              name = "build-test-ami";
              help = "Build AMI images for PostgreSQL testing";
              command = "${lib.getExe self'.packages.build-test-ami} $@";
              category = "ami";
            }
            {
              name = "sync-exts-versions";
              help = "Update extensions versions";
              command = "${lib.getExe self'.packages.sync-exts-versions}";
              category = "extension";
            }
            {
              name = "start-postgres-server";
              help = "Start a local Postgres server";
              command = "${lib.getExe pkgs.nix} run .#start-server -- $@";
              category = "postgres";
            }
            {
              name = "start-postgres-client";
              help = "Start an interactive psql with the specified Postgres version";
              command = "${lib.getExe pkgs.nix} run .#start-client -- $@";
              category = "postgres";
            }
            {
              name = "start-postgres-replica";
              help = "Start a local Postgres replica server";
              command = "${lib.getExe pkgs.nix} run .#start-replica -- $@";
              category = "postgres";
            }
            {
              name = "migrate-postgres";
              help = "Run database migrations";
              command = "${lib.getExe pkgs.nix} run .#migrate-tool -- $@";
              category = "postgres";
            }
            {
              name = "dbmate-tool";
              help = "Run dbmate against specified local Postgres database";
              command = "${lib.getExe pkgs.nix} run .#dbmate-tool -- $@";
              category = "postgres";
            }
          ];
        };
      };
    };
}
