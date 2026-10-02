{ haskell }:

let
  inherit (haskell) lib;
in
_: prev: {
  # To pin custom versions of Haskell packages:
  #   protolude =
  #     prev.callHackageDirect
  #       {
  #         pkg = "protolude";
  #         ver = "0.3.0";
  #         sha256 = "<sha256>";
  #       }
  #       { };
  #
  # To temporarily pin unreleased versions from GitHub:
  #   <name> =
  #     prev.callCabal2nixWithOptions "<name>" (fetchFromGitHub {
  #       owner = "<owner>";
  #       repo  = "<repo>";
  #       rev = "<commit>";
  #       sha256 = "<sha256>";
  #    }) "--subpath=<subpath>" {};
  #
  # To fill in the sha256:
  #   update-nix-fetchgit nix/overlays/haskell-packages.nix
  #
  # - Nowadays you can just delete the sha256 attribute above and nix will assume a fake sha.
  # Once you build the derivation it will suggest the correct sha.
  # - If the library fails its test suite (usually when it runs IO tests), wrap the expression with `lib.dontCheck ()`
  # - <subpath> is usually "."
  # - When adding a new library version here, postgrest.cabal and stack.yaml must also be updated
  #
  # Notes:
  # - When adding a new package version here, update cabal.
  #   + Update postgrest.cabal with the package version
  #   + Update the index-state in cabal.project.freeze. Run `cabal update` which should return the latest index state.
  # - When adding a new package version here, you have to update stack.
  #   + To update stack.yaml add:
  #   extra-deps:
  #     - <package>-<ver>
  #   + For stack.yaml.lock, CI should report an error with the correct lock, copy/paste that one into the file
  # - To modify and try packages locally, see "Working with locally modified Haskell packages" in the Nix README.

  # Before upgrading fuzzyset to 0.3, check: https://github.com/PostgREST/postgrest/issues/3329
  fuzzyset = prev.fuzzyset_0_2_4;

  # TODO: Remove once available in nixpkgs
  aeson-jsonpath = prev.callHackageDirect {
    pkg = "aeson-jsonpath";
    ver = "0.4.2.0";
    sha256 = "sha256-K+3brf1zjSSjojtSCXFrip5rrP7AO/S4zndAxAnvEfc=";
  } { };

  http2 = prev.callHackageDirect {
    pkg = "http2";
    ver = "5.4.0";
    sha256 = "sha256-PeEWVd61bQ8G7LvfLeXklzXqNJFaAjE2ecRMWJZESPE=";
  } { };

  http-semantics = prev.callHackageDirect {
    pkg = "http-semantics";
    ver = "0.4.0";
    sha256 = "sha256-rh0z51EKvsu5rQd5n2z3fSRjjEObouNZSBPO9NFYOF0=";
  } { };

  network-run = prev.callHackageDirect {
    pkg = "network-run";
    ver = "0.5.0";
    sha256 = "sha256-vbXh+CzxDsGApjqHxCYf/ijpZtUCApFbkcF5gyN0THU=";
  } { };

  warp = lib.dontCheck (
    prev.callHackageDirect {
      pkg = "warp";
      ver = "3.4.14";
      sha256 = "sha256-RnoOUlC6dOP0sK/tYAJCX1oLzVFG1GILUY+yVbmvW8Y=";
    } { }
  );
}
