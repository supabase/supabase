let
  lock = builtins.fromJSON (builtins.readFile ./flake.lock);
in
{
  system ? builtins.currentSystem,
  compiler ? "ghc9123",
  # Commit of the Nixpkgs repository that we want to use.
  # It defaults to reading the inputs from flake.lock, which serves
  # as a compatibility layer for non-flake builds / default.nix / shell.nix.
  nixpkgsVersion ? {
    inherit (lock.nodes.nixpkgs.locked) owner repo rev;
    tarballHash = lock.nodes.nixpkgs.locked.narHash;
  },
  # Nix files that describe the Nixpkgs repository. We evaluate the expression
  # using `import` below.
  nixpkgs ?
    let
      inherit (nixpkgsVersion)
        owner
        repo
        rev
        tarballHash
        ;
    in
    fetchTarball {
      url = "https://github.com/${owner}/${repo}/archive/${rev}.tar.gz";
      sha256 = tarballHash;
    },
}:

let
  # PostgREST source files, filtered based on the rules in the .gitignore files
  # and file extensions. We want to include as little as possible, as the files
  # added here will increase the space used in the Nix store and trigger the
  # build of new Nix derivations when changed.
  src = pkgs.lib.sourceFilesBySuffices (pkgs.gitignoreSource ./.) [
    ".cabal"
    ".hs"
    ".hsc"
    ".lhs"
    "LICENSE"
  ];

  # Evaluated expression of the Nixpkgs repository.
  pkgs = import nixpkgs {
    inherit system;
    overlays = [ (import ./nix/overlays) ];
  };

  treefmtNixSrc =
    let
      inherit (lock.nodes.treefmt-nix) locked;
      inherit (locked) owner repo rev;
    in
    fetchTarball {
      url = "https://github.com/${owner}/${repo}/archive/${rev}.tar.gz";
      sha256 = locked.narHash;
    };

  treefmtNix = ((import treefmtNixSrc).evalModule pkgs ./nix/treefmt.nix).config.build;

  postgresqlVersions = [
    {
      name = "pg-19";
      postgresql = pkgs.postgresql_19.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
    }
    {
      name = "pg-18";
      postgresql = pkgs.postgresql_18.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
    }
    {
      name = "pg-17";
      postgresql = pkgs.postgresql_17.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
    }
    {
      name = "pg-16";
      postgresql = pkgs.postgresql_16.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
    }
    {
      name = "pg-15";
      postgresql = pkgs.postgresql_15.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
    }
    {
      name = "pg-14";
      postgresql = pkgs.postgresql_14.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
    }
    {
      name = "oriole-18";
      postgresql = pkgs.orioledb.withPackages (p: [
        p.postgis
        p.pg_safeupdate
      ]);
      config = "
          default_table_access_method = 'orioledb'
          shared_preload_libraries = 'orioledb, pg_stat_statements'
        ";
    }
  ];

  haskellPackages = pkgs.haskell.packages."${compiler}".override {
    overrides = pkgs.callPackage ./nix/overlays/haskell-packages.nix { };
  };

  # Dynamic derivation for PostgREST
  postgrest = pkgs.lib.pipe (haskellPackages.callCabal2nix "postgrest" src { }) [
    # To allow ghc-datasize to be used.
    lib.disableLibraryProfiling
    # We are never going to use shared haskell libraries anyway. "Dynamic" refers to how
    # non-haskell deps are linked. All haskell dependencies are always statically linked.
    lib.disableSharedLibraries
  ];

  staticHaskellPackage = import nix/static.nix { inherit compiler pkgs src; };

  # Options passed to cabal in dev tools and tests
  devCabalOptions = "-f dev --test-show-detail=direct";

  inherit (pkgs.haskell) lib;

  nixos-lib = import (pkgs.path + "/nixos/lib") { };
  runTest =
    postgrest: test:
    (nixos-lib.runTest {
      hostPkgs = pkgs;
      # Replace the top-level `pkgs.postgrest` attribute with our current version on this branch.
      defaults.nixpkgs.overlays = [ (_: _: { inherit postgrest; }) ];
      # Speeds up evaluation a little bit; documentation is really not required for tests.
      defaults.documentation.enable = pkgs.lib.mkDefault false;
      imports = [ test ];
    }).config.result;
in
rec {
  inherit nixpkgs pkgs treefmtNix;

  # Derivation for the PostgREST Haskell package, including the executable,
  # libraries and documentation. We disable running the test suite on Nix
  # builds, as they require a database to be set up. We split the binary
  # into a separate output, so that the default distribution via flake.nix
  # has a much smaller closure size.
  postgrestPackage = pkgs.lib.pipe postgrest [
    lib.dontCheck
    lib.enableSeparateBinOutput
    (haskellPackages.generateOptparseApplicativeCompletions [ "postgrest" ])
  ];

  # Profiled dynamic executable.
  postgrestProfiled = pkgs.lib.pipe postgrestPackage [
    lib.enableExecutableProfiling
    lib.enableLibraryProfiling
    lib.dontHaddock
  ];

  inherit (postgrest) env;

  # Tooling for analyzing Haskell imports and exports.
  hsie = pkgs.callPackage nix/hsie {
    inherit (haskellPackages) ghcWithPackages;
  };

  # Used by CI on MacOS
  inherit (pkgs) nix-build-uncached;

  ### Tools

  cabalTools = pkgs.callPackage nix/tools/cabalTools.nix { inherit devCabalOptions postgrest; };

  withTools = pkgs.callPackage nix/tools/withTools.nix { inherit postgresqlVersions postgrest; };

  # Development tools.
  devTools = pkgs.callPackage nix/tools/devTools.nix {
    inherit
      tests
      devCabalOptions
      hsie
      treefmtNix
      ;
  };

  # Documentation tools.
  docs = pkgs.callPackage nix/tools/docs.nix { };

  # Git tools.
  gitTools = pkgs.callPackage nix/tools/gitTools.nix { inherit treefmtNix; };

  # Load testing tools.
  loadtest = pkgs.callPackage nix/tools/loadtest.nix { inherit withTools; };

  # Utility for updating the pinned version of Nixpkgs.
  nixpkgsTools = pkgs.callPackage nix/tools/nixpkgsTools.nix { };

  # Scripts for publishing new releases.
  release = pkgs.callPackage nix/tools/release.nix { };

  # Scripts for running tests.
  tests = pkgs.callPackage nix/tools/tests.nix {
    inherit postgrest devCabalOptions withTools;
    ghc = pkgs.haskell.compiler."${compiler}";
    inherit (pkgs.haskell.packages."${compiler}") hpc-codecov;
    inherit (pkgs.haskell.packages."${compiler}") weeder;
  };
}
// pkgs.lib.optionalAttrs pkgs.stdenv.isLinux rec {
  # Static executable.
  inherit (staticHaskellPackage) postgrestStatic;
  inherit (staticHaskellPackage) packagesStatic;

  # Docker images and loading script.
  docker = pkgs.callPackage nix/tools/docker { postgrest = postgrestStatic; };

  # NixOS VM tests
  nixpkgs-nixos-test = runTest postgrestStatic (pkgs.path + "/nixos/tests/postgrest.nix");
}
