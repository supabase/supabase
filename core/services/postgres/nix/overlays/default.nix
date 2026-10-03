{ self, ... }:
{
  flake.overlays.default = final: prev: {
    # NOTE: add any needed overlays here. in theory we could
    # pull them from the overlays/ directory automatically, but we don't
    # want to have an arbitrary order, since it might matter. being
    # explicit is better.

    inherit (self.packages.${final.stdenv.hostPlatform.system})
      postgresql_15
      postgresql_17
      postgresql_orioledb-17
      supabase-groonga
      switch-ext-version
      mecab-naist-jdic
      ;

    xmrig = throw "The xmrig package has been explicitly disabled in this flake.";

    # Hold cgal back to 6.0.2 until nixpkgs bumps sfcgal past 2.2.0 (incompatible with CGAL 6.1+).
    cgal = prev.cgal.overrideAttrs (_: {
      version = "6.0.2";
      src = final.fetchurl {
        url = "https://github.com/CGAL/cgal/releases/download/v6.0.2/CGAL-6.0.2.tar.xz";
        sha256 = "sha256-8wxb58JaKj6iS8y6q1z2P6/aY8AnnzTX5/izISgh/tY=";
      };
    });

    cargo-pgrx = final.callPackage ../cargo-pgrx/default.nix {
      inherit (final) lib;
      inherit (final) fetchCrate;
      inherit (final) openssl;
      inherit (final) pkg-config;
      inherit (final) makeRustPlatform;
      inherit (final) stdenv;
      inherit (final) rust-bin;
    };
  };
}
