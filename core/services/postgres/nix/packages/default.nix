{ self, inputs, ... }:
{
  imports = [
    ./postgres.nix
    ./postgres-env.nix
    ./site-env.nix
    ./extension-catalog.nix
  ];
  perSystem =
    {
      inputs',
      lib,
      pkgs,
      self',
      ...
    }:
    let
      activeVersion = "15";
      # Function to create the pg_regress package
      makePgRegress =
        version:
        let
          postgresqlPackage = self'.packages."postgresql_${version}";
        in
        pkgs.callPackage ../ext/pg_regress.nix { postgresql = postgresqlPackage; };
      # Function to create the pg_isolation_regress package
      makePgIsolationRegress =
        version:
        let
          postgresqlPackage = self'.packages."postgresql_${version}";
        in
        pkgs.callPackage ../ext/pg_isolation_regress.nix { postgresql = postgresqlPackage; };
      pgsqlSuperuser = "supabase_admin";
      supascan-pkgs = pkgs.callPackage ./supascan.nix {
        inherit (pkgs) lib;
        inherit inputs;
      };
      pg-startup-profiler-pkgs = pkgs.callPackage ./pg-startup-profiler.nix {
        inherit (pkgs) lib;
      };
      pkgs-lib = pkgs.callPackage ./lib.nix {
        psql_15 = self'.packages."psql_15/bin";
        psql_17 = self'.packages."psql_17/bin";
        psql_orioledb-17 = self'.packages."psql_orioledb-17/bin";
        inherit (self.supabase) defaults;
      };
    in
    {
      packages = (
        {
          build-ami = pkgs.callPackage ./build-ami.nix { packer = self'.packages.packer; };
          build-qemu-image = pkgs.callPackage ./build-qemu-image { packer = self'.packages.packer; };
          build-test-ami = pkgs.callPackage ./build-test-ami.nix { packer = self'.packages.packer; };
          cleanup-ami = pkgs.callPackage ./cleanup-ami.nix { };
          dbmate-tool = pkgs.callPackage ./dbmate-tool.nix { inherit (self.supabase) defaults; };
          docker-image-inputs = pkgs.callPackage ./docker-image-inputs.nix {
            psql_15_slim = self'.packages."psql_15_slim/bin";
            psql_17_slim = self'.packages."psql_17_slim/bin";
            psql_orioledb-17_slim = self'.packages."psql_orioledb-17_slim/bin";
            supabase-groonga = self'.packages.supabase-groonga;
          };
          docs = pkgs.callPackage ./docs.nix { };
          pgbouncer = pkgs.callPackage ../pgbouncer.nix { };
          github-matrix = pkgs.callPackage ./github-matrix {
            nix-eval-jobs = inputs'.nix-eval-jobs.packages.default;
          };
          gatekeeper = pkgs.callPackage ./gatekeeper.nix { inherit inputs pkgs; };
          supabase-groonga = pkgs.callPackage ../ext/pgroonga/groonga.nix { };
          http-mock-server = pkgs.callPackage ./http-mock-server.nix { };
          image-size-analyzer = pkgs.callPackage ./image-size-analyzer.nix { };
          local-infra-bootstrap = pkgs.callPackage ./local-infra-bootstrap.nix { };
          mecab-naist-jdic = pkgs.callPackage ./mecab-naist-jdic.nix { };
          migrate-tool = pkgs.callPackage ./migrate-tool.nix { psql_15 = self'.packages."psql_15/bin"; };
          overlayfs-on-package = pkgs.callPackage ./overlayfs-on-package.nix { };
          packer = pkgs.callPackage ./packer.nix { inherit inputs; };
          pg-activity = inputs.nixpkgs.legacyPackages.${pkgs.stdenv.hostPlatform.system}.pg_activity;
          pg-backrest = pkgs.callPackage ./pg-backrest.nix { };
          pgctld = pkgs.callPackage ./pgctld.nix {
            multigres-src = inputs.multigres;
          };
          pg-restore = pkgs.callPackage ./pg-restore.nix { psql_15 = self'.packages."psql_15/bin"; };
          pg_prove = pkgs.perlPackages.TAPParserSourceHandlerpgTAP;
          pg_regress = makePgRegress activeVersion;
          pg_isolation_regress = makePgIsolationRegress activeVersion;
          run-testinfra = pkgs.callPackage ./run-testinfra.nix { };
          show-commands = pkgs.callPackage ./show-commands.nix { };
          start-client = pkgs.callPackage ./start-client.nix {
            psql_15 = self'.packages."psql_15/bin";
            psql_17 = self'.packages."psql_17/bin";
            psql_orioledb-17 = self'.packages."psql_orioledb-17/bin";
            inherit (self.supabase) defaults;
          };
          psql_17_cli_portable = pkgs.callPackage ./postgres-portable.nix {
            psql_17_cli = self'.legacyPackages.psql_17_cli;
          };
          start-replica = pkgs.callPackage ./start-replica.nix {
            psql_15 = self'.packages."psql_15/bin";
            inherit pgsqlSuperuser;
          };
          start-server = pkgs-lib.makePostgresDevSetup {
            inherit pkgs;
            name = "start-postgres-server";
            pgroonga = self'.legacyPackages."psql_${activeVersion}".exts.pgroonga;
          };
          switch-ext-version = pkgs.callPackage ./switch-ext-version.nix {
            inherit (self'.packages) overlayfs-on-package;
          };
          sync-exts-versions = pkgs.callPackage ./sync-exts-versions.nix { inherit (inputs') nix-editor; };
          trigger-nix-build = pkgs.callPackage ./trigger-nix-build.nix { };
          update-readme = pkgs.callPackage ./update-readme.nix { };
          supabase-cli = pkgs.callPackage ./supabase-cli.nix { };
          docker-image-test = pkgs.callPackage ./docker-image-test.nix {
            psql_15 = self'.packages."psql_15/bin";
            psql_17 = self'.packages."psql_17/bin";
            psql_orioledb-17 = self'.packages."psql_orioledb-17/bin";
            inherit (self'.packages) pg_regress;
          };
          cli-smoke-test = pkgs.callPackage ./cli-smoke-test.nix {
            inherit (self'.packages) supabase-cli;
            inherit (pkgs) yq;
            postgresql_15 = self'.packages."postgresql_15";
          };
          inherit (pkgs.callPackage ./wal-g.nix { }) wal-g-2 wal-g-3;
          inherit (supascan-pkgs) goss supascan supascan-specs;
          inherit (pg-startup-profiler-pkgs) pg-startup-profiler;
        }
        // lib.optionalAttrs pkgs.stdenv.isDarwin {
          setup-darwin-linux-builder = pkgs.callPackage ./setup-darwin-linux-builder.nix {
            inherit inputs self;
          };
          verify-darwin-linux-builder = pkgs.callPackage ./verify-darwin-linux-builder.nix { };
        }
        // lib.filterAttrs (n: _v: n != "override" && n != "overrideAttrs" && n != "overrideDerivation") (
          pkgs.callPackage ../postgresql/default.nix {
            inherit self';
            inherit (self.supabase) supportedPostgresVersions;
          }
        )
      );
    };
}
