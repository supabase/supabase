{
  config,
  lib,
  pkgs,
  ...
}:
let
  hlintConfig = pkgs.writeText "hlintConfig.yml" ''

    # Arguments passed to hlint
    - arguments: [-XQuasiQuotes, -XNoPatternSynonyms]

    # Warnings
    - warn: { lhs: "a == a", rhs: "True",  note: "This comparison always evaluates to True" }
    - warn: { lhs: "a /= a", rhs: "False", note: "This comparison always evaluates to False" }
    - warn: { lhs: "a < a",  rhs: "False", note: "This comparison always evaluates to False" }
    - warn: { lhs: "a > a",  rhs: "False", note: "This comparison always evaluates to False" }
    - warn: { lhs: "a <= a", rhs: "True",  note: "This comparison always evaluates to True" }
    - warn: { lhs: "a >= a", rhs: "True",  note: "This comparison always evaluates to True" }
  '';
in
{
  settings.verbose = 1;
  settings.on-unmatched = "debug";

  programs.actionlint.enable = true;
  programs.black.enable = true;
  programs.deadnix.enable = true;
  programs.fourmolu.enable = true;
  programs.hlint.enable = true;
  programs.nixf-diagnose.enable = true;
  programs.nixfmt.enable = true;
  programs.ruff-check.enable = true;
  programs.zizmor.enable = true;

  programs.fourmolu.ghcOpts = [
    "BangPatterns"
    "ImportQualifiedPost"
  ];

  settings.formatter.hlint = {
    command = pkgs.writeShellApplication {
      name = "hlint-wrapper";
      runtimeInputs = with pkgs; [
        jq
        # The "apply-refact" package is marked broken in nixpkgs because it
        # doesn't build with GHC 9.10, so we are using the GHC 9.12 pinned version.
        # https://github.com/mpickering/apply-refact#ghc-version-compatibility
        haskell.packages.ghc912.apply-refact
      ];
      # hlint with --refactor flag does not support more than a single file at a time,
      # so loop through these files manually.
      # Unfortuantely, hlint is painfully slow doing so, so we run it on all provided files first
      # and then loop through the files which require changes only.
      text = ''
        mapfile -t filenames < <(
            ${lib.getExe config.programs.hlint.package} --hint=${hlintConfig} --json "$@" \
              | jq -r '.[].file' \
              | sort -u \
              | grep -v '^$'
        )

        for file in "''${filenames[@]}"; do
            ${lib.getExe config.programs.hlint.package} \
              --hint="${hlintConfig}" \
              --refactor \
              --refactor-options=--inplace \
              "$file"
        done
      '';
    };
  };

  # ruff has gaps in scanning for unused code, so we use vulture
  settings.formatter.vulture = {
    command = "${lib.getExe pkgs.python3Packages.vulture}";
    options = [
      "--min-confidence"
      "80"
    ];
    includes = [ "*.py" ];
    excludes = [ "docs/conf.py" ];
  };
}
