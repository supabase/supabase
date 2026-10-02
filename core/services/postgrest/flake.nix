{
  description = "REST API for any Postgres database";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  nixConfig = {
    extra-substituters = "https://postgrest.cachix.org";
    extra-trusted-public-keys = "postgrest.cachix.org-1:icgW4R15fz1+LqvhPjt4EnX/r19AaqxiVV+1olwlZtI=";
  };

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];

      pgrstFor =
        system:
        import ./default.nix {
          inherit system;
          nixpkgsVersion = {
            owner = "nixos";
            repo = "nixpkgs";
            inherit (nixpkgs) rev;
            tarballHash = nixpkgs.narHash;
          };
        };

      genSystems = f: nixpkgs.lib.genAttrs systems (system: f (pgrstFor system));
    in
    {
      packages = genSystems (
        attrs:
        {
          default = attrs.postgrestPackage.bin;
          profiled = attrs.postgrestProfiled.bin;
        }
        // nixpkgs.lib.optionalAttrs (attrs ? postgrestStatic) {
          static = attrs.postgrestStatic;
        }
      );

      apps = genSystems (attrs: {
        default = {
          type = "app";
          program = "${attrs.postgrestStatic or attrs.postgrestPackage.bin}/bin/postgrest";
          meta.description = "REST API for any Postgres database";
        };
      });

      devShells = genSystems (postgrest: {
        default = import ./shell.nix { inherit postgrest; };
      });

      formatter = genSystems (attrs: attrs.treefmtNix.wrapper);
    };
}
