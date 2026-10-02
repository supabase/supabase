{ inputs, ... }:
{
  perSystem =
    { pkgs, lib, ... }:
    let
      # Minimal glibc locales for slim images - only en_US.UTF-8 (~3MB vs ~200MB)
      glibcLocalesMinimal = pkgs.glibcLocales.override {
        allLocales = false;
        locales = [ "en_US.UTF-8/UTF-8" ];
      };

      # Custom extensions that exist in our repository. These aren't upstream
      # either because nobody has done the work, maintaining them here is
      # easier and more expedient, or because they may not be suitable, or are
      # too niche/one-off.
      #
      # Ideally, most of these should have copies upstream for third party
      # use, but even if they did, keeping our own copies means that we can
      # rollout new versions of these critical things easier without having to
      # go through the upstream release engineering process.
      ourExtensions = [
        ../ext/rum.nix
        ../ext/timescaledb.nix
        ../ext/pgroonga
        ../ext/index_advisor.nix
        ../ext/wal2json.nix
        ../ext/pgmq
        ../ext/pg_repack.nix
        ../ext/pg-safeupdate.nix
        ../ext/plpgsql-check.nix
        ../ext/pgjwt.nix
        ../ext/pgaudit.nix
        ../ext/postgis.nix
        ../ext/pgrouting
        ../ext/pgtap.nix
        ../ext/pg_cron
        ../ext/pgsql-http.nix
        ../ext/pg_plan_filter.nix
        ../ext/pg_net.nix
        ../ext/pg_hashids.nix
        ../ext/pgsodium.nix
        ../ext/pg_graphql
        ../ext/pg_stat_monitor.nix
        ../ext/pg_jsonschema
        ../ext/pg_partman.nix
        ../ext/pgvector.nix
        ../ext/vault.nix
        ../ext/hypopg.nix
        ../ext/pg_tle.nix
        ../ext/wrappers/default.nix
        ../ext/supautils.nix
        ../ext/plv8
      ];

      #Where we import and build the orioledb extension, we add on our custom extensions
      # plus the orioledb option
      #we're not using timescaledb or plv8 in the orioledb-17 version or pg 17 of supabase extensions
      orioleFilteredExtensions = builtins.filter (
        x: x != ../ext/timescaledb.nix && x != ../ext/timescaledb-2.9.1.nix && x != ../ext/plv8
      ) ourExtensions;

      orioledbExtensions = orioleFilteredExtensions ++ [ ../ext/orioledb.nix ];
      dbExtensions17 = orioleFilteredExtensions;

      # CLI extensions - minimal set for Supabase CLI with migration support
      cliExtensions = [
        ../ext/supautils.nix
        ../ext/pg_graphql
        ../ext/pgsodium.nix
        ../ext/vault.nix
        ../ext/pg_net.nix
        ../ext/pg_cron
        ../ext/pg-safeupdate.nix
      ];

      getPostgresqlPackage =
        version: latestOnly:
        let
          base = pkgs."postgresql_${version}";
        in
        if latestOnly then base.override { systemdSupport = false; } else base;
      # Create a 'receipt' file for a given postgresql package. This is a way
      # of adding a bit of metadata to the package, which can be used by other
      # tools to inspect what the contents of the install are: the PSQL
      # version, the installed extensions, et cetera.
      #
      # This takes two arguments:
      #  - pgbin: the postgresql package we are building on top of
      #    not a list of packages, but an attrset containing extension names
      #    mapped to versions.
      #  - ourExts: the list of extensions from upstream nixpkgs. This is not
      #    a list of packages, but an attrset containing extension names
      #    mapped to versions.
      #
      # The output is a package containing the receipt.json file, which can be
      # merged with the PostgreSQL installation using 'symlinkJoin'.
      makeReceipt =
        pgbin: ourExts:
        pkgs.writeTextFile {
          name = "receipt";
          destination = "/receipt.json";
          text = builtins.toJSON {
            psql-version = pgbin.version;
            nixpkgs = {
              revision = inputs.nixpkgs.rev;
            };
            extensions = ourExts;

            # NOTE this field can be used to do cache busting (e.g.
            # force a rebuild of the psql packages) but also to helpfully inform
            # tools what version of the schema is being used, for forwards and
            # backwards compatibility
            receipt-version = "1";
          };
        };

      makeOurPostgresPkgs =
        version:
        {
          variant ? "full",
          latestOnly ? false,
        }:
        let
          postgresql = getPostgresqlPackage version latestOnly;
          extensionsToUse =
            if variant == "cli" then
              cliExtensions
            else if (builtins.elem version [ "orioledb-17" ]) then
              orioledbExtensions
            else if (builtins.elem version [ "17" ]) then
              dbExtensions17
            else
              ourExtensions;
          extCallPackage = pkgs.lib.callPackageWith (
            pkgs
            // {
              inherit postgresql latestOnly;
              switch-ext-version = extCallPackage ./switch-ext-version.nix { };
              overlayfs-on-package = extCallPackage ./overlayfs-on-package.nix { };
            }
          );
        in
        map (path: extCallPackage path { }) extensionsToUse;

      # Create an attrset that contains all the extensions included in a server.
      makeOurPostgresPkgsSet =
        version:
        {
          variant ? "full",
          latestOnly ? false,
        }:
        let
          pkgsList = makeOurPostgresPkgs version { inherit variant latestOnly; };
          baseAttrs = builtins.listToAttrs (
            map (drv: {
              name = drv.name;
              value = drv;
            }) pkgsList
          );
          # Expose individual packages from extensions that have them in passthru.packages
          # This makes them discoverable by nix-eval-jobs --force-recurse
          individualPkgs = lib.concatMapAttrs (
            name: drv: lib.optionalAttrs (drv ? passthru.packages) { "${name}-pkgs" = drv.passthru.packages; }
          ) baseAttrs;
        in
        baseAttrs // individualPkgs // { recurseForDerivations = true; };

      # Create a binary distribution of PostgreSQL, given a version.
      #
      # NOTE: The version here does NOT refer to the exact PostgreSQL version;
      # it refers to the *major number only*, which is used to select the
      # correct version of the package from nixpkgs. This is because we want
      # to be able to do so in an open ended way. As an example, the version
      # "15" passed in will use the nixpkgs package "postgresql_15" as the
      # basis for building extensions, etc.
      makePostgresBin =
        version:
        {
          variant ? "full",
          latestOnly ? false,
        }:
        let
          # For CLI variant, override PostgreSQL to be portable (no hardcoded /nix/store paths)
          postgresql =
            let
              base = getPostgresqlPackage version latestOnly;
            in
            if variant == "cli" then base.override { portable = true; } else base;
          postgres-pkgs = makeOurPostgresPkgs version { inherit variant latestOnly; };
          ourExts = map (ext: {
            name = ext.name;
            version = ext.version;
          }) postgres-pkgs;

          pgbin = postgresql.withPackages (_ps: postgres-pkgs);

          # For slim packages, include minimal glibc locales for initdb locale support
          extraPaths = lib.optionals (latestOnly && pkgs.stdenv.isLinux) [
            glibcLocalesMinimal
          ];
        in
        pkgs.symlinkJoin {
          inherit (pgbin) name version;
          paths = [
            pgbin
            (makeReceipt pgbin ourExts)
          ]
          ++ extraPaths;
          passthru = {
            inherit version;
          };
        };

      # Create an attribute set, containing all the relevant packages for a
      # PostgreSQL install, wrapped up with a bow on top. There are three
      # packages:
      #
      #  - bin: the postgresql package itself, with all the extensions
      #    installed, and a receipt.json file containing metadata about the
      #    install.
      #  - exts: an attrset containing all the extensions, mapped to their
      #    package names.
      makePostgres =
        version:
        {
          variant ? "full",
          latestOnly ? false,
        }:
        lib.recurseIntoAttrs {
          bin = makePostgresBin version { inherit variant latestOnly; };
          exts = makeOurPostgresPkgsSet version { inherit variant latestOnly; };
        };
      basePackages = {
        psql_15 = makePostgres "15" { };
        psql_17 = makePostgres "17" { };
        psql_orioledb-17 = makePostgres "orioledb-17" { };
      };
      slimPackages = {
        psql_15_slim = makePostgres "15" { latestOnly = true; };
        psql_17_slim = makePostgres "17" { latestOnly = true; };
        psql_orioledb-17_slim = makePostgres "orioledb-17" { latestOnly = true; };
      };

      # CLI packages - minimal PostgreSQL + supautils only for Supabase CLI
      cliPackages = {
        psql_17_cli = makePostgres "17" { variant = "cli"; };
      };

      binPackages = lib.mapAttrs' (name: value: {
        name = "${name}/bin";
        value = value.bin;
      }) (basePackages // slimPackages // cliPackages);
    in
    {
      packages = binPackages;
      legacyPackages = basePackages // slimPackages // cliPackages;
    };
}
