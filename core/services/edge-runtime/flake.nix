{
  description = "Supabase Edge Runtime";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = inputs @ {
    self,
    nixpkgs,
    flake-utils,
    flake-parts
  }: flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        # TODO: Missing "x86_64-darwin" supabase/rusty_v8
        #"x86_64-darwin"
        "x86_64-linux"
      ];

      perSystem = { system, pkgs, inputs', ... }:
      rec {
        packages = {
          edge-runtime = pkgs.callPackage ./nix/edge-runtime.nix { };
          default = packages.edge-runtime;
        };
      };
  };
}

