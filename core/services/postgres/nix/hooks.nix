{ inputs, ... }:
let
  ghWorkflows = builtins.attrNames (builtins.readDir ../.github/workflows);
  lintedWorkflows = [
    "ami-release-nix.yml"
    "nix-build.yml"
    "nix-eval.yml"
    "testinfra-ami-build.yml"
  ];
in
{
  imports = [ inputs.git-hooks.flakeModule ];
  perSystem =
    { config, pkgs, ... }:
    {
      pre-commit = {
        check.enable = true;
        settings = {
          hooks = {
            actionlint = {
              enable = true;
              excludes = builtins.filter (name: !builtins.elem name lintedWorkflows) ghWorkflows;
              verbose = true;
            };
            ansible-lint = {
              enable = true;
              args = [ "ansible" ];
              settings.subdir = "ansible";
              settings.configPath = "ansible/ansible-lint.yaml";
              verbose = true;
            };
            versioning-scheme = {
              enable = true;
              name = "versioning-scheme";
              description = "Ensure postgres_release versions match versioning scheme";
              entry = pkgs.lib.getExe (
                pkgs.writeShellApplication {
                  name = "versioning-scheme";
                  runtimeInputs = with pkgs; [
                    yq-go
                  ];
                  text = ''
                    exit_code=0
                    while read -r supa _ version; do
                      err() { echo "ERROR: postgres_release.$supa=$version is invalid," "$*" >&2; exit_code=1; }

                      flavor=''${supa#postgres*}
                      major=''${flavor#*-}

                      if [[ $version == *orioledb* ]] && [[ $flavor != orioledb-* ]]; then
                        err "must not contain orioledb for non-orioledb PGs"
                        continue
                      fi
                      if [[ $version == *-cli ]]; then
                        err "must not contain -cli suffix"
                        continue
                      fi

                      re=^$major
                      re+='(\.[0-9]+){3}'
                      if [[ $flavor == orioledb-* ]]; then
                        re+=-orioledb
                      fi
                      re+='(-[0-9a-zA-Z_-]+)?$'

                      if ! [[ $version =~ $re ]]; then
                        err "does not match $re"
                      fi
                    done < <(yq -o props '.postgres_release' ansible/vars.yml)
                    exit $exit_code
                  '';
                }
              );
              files = "^ansible/vars\\.yml$";
              language = "system";
              verbose = true;
            };
            shellcheck.enable = true;
            treefmt = {
              enable = true;
              package = config.treefmt.build.wrapper;
              pass_filenames = false;
              verbose = true;
            };
          };
        };
      };
    };
}
