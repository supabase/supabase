{
  lib,
  stdenv,
  callPackages,
  fetchFromGitHub,
  openssl,
  pkg-config,
  postgresql,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  rust-bin,
  git,
  latestOnly ? false,
}:
let
  pname = "wrappers";
  build =
    version: hash: rustVersion: pgrxVersion:
    let
      cargo = rust-bin.stable.${rustVersion}.default;
      mkPgrxExtension = callPackages ../../cargo-pgrx/mkPgrxExtension.nix {
        inherit rustVersion pgrxVersion;
      };
    in
    mkPgrxExtension (
      rec {
        inherit pname version postgresql;

        src = fetchFromGitHub {
          owner = "supabase";
          repo = "wrappers";
          rev = "v${version}";
          inherit hash;
        };

        nativeBuildInputs = [
          pkg-config
          cargo
          git
        ];
        buildInputs = [
          openssl
          postgresql
        ];

        NIX_LDFLAGS = "-L${postgresql}/lib -lpq";

        # Set necessary environment variables for pgrx in darwin only
        env = lib.optionalAttrs stdenv.isDarwin {
          POSTGRES_LIB = "${postgresql}/lib";
          RUSTFLAGS = "-C link-arg=-undefined -C link-arg=dynamic_lookup";
        };

        OPENSSL_NO_VENDOR = 1;
        #need to set this to 2 to avoid cpu starvation
        CARGO_BUILD_JOBS = "2";
        CARGO = "${cargo}/bin/cargo";

        cargoLock = {
          lockFile = "${src}/Cargo.lock";
          outputHashes =
            if builtins.compareVersions "0.4.2" version >= 0 then
              { "clickhouse-rs-1.0.0-alpha.1" = "sha256-0zmoUo/GLyCKDLkpBsnLAyGs1xz6cubJhn+eVqMEMaw="; }
            else if builtins.compareVersions "0.5.0" version >= 0 then
              { "clickhouse-rs-1.1.0-alpha.1" = "sha256-G+v4lNP5eK2U45D1fL90Dq24pUSlpIysNCxuZ17eac0="; }
            else if builtins.compareVersions "0.5.2" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.5.1" = "sha256-1JkB2JExukABlbW1lZPolNQCYb9URi8xNYY3APmiGq0=";
              }
            else if builtins.compareVersions "0.5.3" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.5.1" = "sha256-1JkB2JExukABlbW1lZPolNQCYb9URi8xNYY3APmiGq0=";
              }
            else if builtins.compareVersions "0.5.4" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.5.1" = "sha256-1JkB2JExukABlbW1lZPolNQCYb9URi8xNYY3APmiGq0=";
              }
            else if builtins.compareVersions "0.5.4" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.5.1" = "sha256-1JkB2JExukABlbW1lZPolNQCYb9URi8xNYY3APmiGq0=";
              }
            else if builtins.compareVersions "0.5.5" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.6.0" = "sha256-AUK7B0wMqQZwJho91woLs8uOC4k1RdUEEN5Khw2OoqQ=";
              }
            else if builtins.compareVersions "0.5.6" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.6.0" = "sha256-AUK7B0wMqQZwJho91woLs8uOC4k1RdUEEN5Khw2OoqQ=";
              }
            else if builtins.compareVersions "0.5.7" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.6.0" = "sha256-AUK7B0wMqQZwJho91woLs8uOC4k1RdUEEN5Khw2OoqQ=";
              }
            else if builtins.compareVersions "0.6.0" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-catalog-s3tables-0.6.0" = "sha256-AUK7B0wMqQZwJho91woLs8uOC4k1RdUEEN5Khw2OoqQ=";
              }
            else if builtins.compareVersions "0.6.1" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-3CIKx0/imCCXl1VGUAX0E9TqbsZSTEdCpe4ps5p6Ax4=";
              }
            else if builtins.compareVersions "0.6.2" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-3CIKx0/imCCXl1VGUAX0E9TqbsZSTEdCpe4ps5p6Ax4=";
              }
            else if builtins.compareVersions "0.6.3" version == 0 then
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-3CIKx0/imCCXl1VGUAX0E9TqbsZSTEdCpe4ps5p6Ax4=";
              }
            else
              {
                "clickhouse-rs-1.1.0-alpha.1" = "sha256-nKiGzdsAgJej8NgyVOqHaD1sZLrNF1RPfEhu2pRwZ6o=";
                "iceberg-0.5.0" = "sha256-dYPZdpP7kcp49UxsCZrZi3xMJ4rJiB8H65dMMR9Z1Yk=";
              };
        };

        preConfigure = ''
          cd wrappers

          # update the clickhouse-rs dependency
          # append the branch name to the git URL to help cargo locate the commit
          # while maintaining the rev for reproducibility
          awk -i inplace '
          /\[dependencies.clickhouse-rs\]/ {
            print
            getline
            if ($0 ~ /git =/) {
              print "git = \"https://github.com/burmecia/clickhouse-rs/supabase-patch\""
            } else {
              print
            }
            while ($0 !~ /^\[/ && NF > 0) {
              getline
              if ($0 ~ /rev =/) print
              if ($0 ~ /^\[/) print
            }
            next
          }
          { print }
          ' Cargo.toml

          # Verify the file is still valid TOML, break build with this erroru
          # if it is not
          if ! cargo verify-project 2>/dev/null; then
            echo "Failed to maintain valid TOML syntax"
            exit 1
          fi

          cd ..
        '';

        buildAndTestSubdir = "wrappers";
        buildFeatures = [
          "helloworld_fdw"
          "all_fdws"
        ];
        doCheck = false;

        postInstall = ''

          create_control_files() {
            sed -e "/^default_version =/d" \
                -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}-${version}'|" \
              $out/share/postgresql/extension/${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control
            rm $out/share/postgresql/extension/${pname}.control
          }

          create_control_files
        '';

        meta = with lib; {
          description = "Various Foreign Data Wrappers (FDWs) for PostreSQL";
          homepage = "https://github.com/supabase/wrappers";
          license = licenses.postgresql;
          inherit (postgresql.meta) platforms;
        };
      }
      // lib.optionalAttrs (version == "0.3.0") {
        patches = [ ./0001-bump-pgrx-to-0.11.3.patch ];

        cargoLock = {
          lockFile = ./Cargo.lock-0.3.0;
          outputHashes = {
            "clickhouse-rs-1.0.0-alpha.1" = "sha256-0zmoUo/GLyCKDLkpBsnLAyGs1xz6cubJhn+eVqMEMaw=";
          };
        };
      }
    );
  # All versions that were previously packaged (historical list)
  allPreviouslyPackagedVersions = [
    "0.6.2"
    "0.6.1"
    "0.6.0"
    "0.5.7"
    "0.5.6"
    "0.5.5"
    "0.5.4"
    "0.5.3"
    "0.5.2"
    "0.5.1"
    "0.5.0"
    "0.4.6"
    "0.4.5"
    "0.4.4"
    "0.4.3"
    "0.4.2"
    "0.4.1"
    "0.3.0"
    "0.2.0"
    "0.1.19"
    "0.1.18"
    "0.1.17"
    "0.1.16"
    "0.1.15"
    "0.1.14"
    "0.1.12"
    "0.1.11"
    "0.1.10"
    "0.1.9"
    "0.1.8"
    "0.1.7"
    "0.1.6"
    "0.1.5"
    "0.1.4"
    "0.1.1"
    "0.1.0"
  ];
  allVersions = (builtins.fromJSON (builtins.readFile ../versions.json)).wrappers;
  supportedVersions = lib.filterAttrs (
    _: value: builtins.elem (lib.versions.major postgresql.version) value.postgresql
  ) allVersions;
  versions = lib.naturalSort (lib.attrNames supportedVersions);
  latestVersion = lib.last versions;
  numberOfVersions = builtins.length versions;
  versionsToUse =
    if latestOnly then
      lib.filterAttrs (n: _: n == latestVersion) supportedVersions
    else
      supportedVersions;
  versionsBuilt = if latestOnly then [ latestVersion ] else versions;
  numberOfVersionsBuilt = builtins.length versionsBuilt;
  # Filter out previously packaged versions that are actually built for this PG version
  # This prevents double-counting when a version appears in both lists
  previouslyPackagedVersions = builtins.filter (
    v: !(builtins.elem v versions)
  ) allPreviouslyPackagedVersions;
  numberOfPreviouslyPackagedVersions = builtins.length previouslyPackagedVersions;
  packagesAttrSet = lib.mapAttrs' (name: value: {
    name = lib.replaceStrings [ "." ] [ "_" ] name;
    value = build name value.hash value.rust value.pgrx;
  }) versionsToUse;
  packages = builtins.attrValues packagesAttrSet;
in
(buildEnv {
  name = pname;
  paths = packages;
  nativeBuildInputs = [ makeWrapper ];
  pathsToLink = [
    "/lib"
    "/share/postgresql/extension"
  ];
  postBuild = ''

    create_control_files() {
      # Create main control file pointing to latest version
      {
        echo "default_version = '${latestVersion}'"
        cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
      } > $out/share/postgresql/extension/${pname}.control
    }

    create_lib_files() {
      # Create main library symlink to latest version
      ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

      ${
        if latestOnly then
          ''
            # latestOnly mode: skip previouslyPackagedVersions symlinks
          ''
        else
          ''
            # Create symlinks for all previously packaged versions to main library
            for v in ${lib.concatStringsSep " " previouslyPackagedVersions}; do
              ln -sfn $out/lib/${pname}${postgresql.dlSuffix} $out/lib/${pname}-$v${postgresql.dlSuffix}
            done
          ''
      }
    }

    ${
      if latestOnly then
        ''
          # latestOnly mode: skip migration SQL files entirely
        ''
      else
        ''
          create_migration_sql_files() {


            PREVIOUS_VERSION=""
            while IFS= read -r i; do
              FILENAME=$(basename "$i")
              VERSION="$(grep -oE '[0-9]+\.[0-9]+\.[0-9]+' <<< $FILENAME)"
              if [[ "$PREVIOUS_VERSION" != "" ]]; then
                # Always write to $out/share/postgresql/extension, not $DIRNAME
                # because $DIRNAME might be a symlinked read-only path from the Nix store
                # We use -L with cp to dereference symlinks (copy the actual file content, not the symlink)
                MIGRATION_FILENAME="$out/share/postgresql/extension/''${FILENAME/$VERSION/$PREVIOUS_VERSION--$VERSION}"
                cp -L "$i" "$MIGRATION_FILENAME"
              fi
              PREVIOUS_VERSION="$VERSION"
            done < <(find $out -name '*.sql' | sort -V)

            # Create empty SQL files for previously packaged versions that don't exist
            # This compensates for versions that failed to produce SQL files in the past
            for prev_version in ${lib.concatStringsSep " " previouslyPackagedVersions}; do
              sql_file="$out/share/postgresql/extension/wrappers--$prev_version.sql"
              if [ ! -f "$sql_file" ]; then
                echo "-- Empty migration file for previously packaged version $prev_version" > "$sql_file"
              fi
            done

            # Create migration SQL files from previous versions to newer versions
            # Skip if the migration file already exists (to avoid conflicts with the first loop)
            for prev_version in ${lib.concatStringsSep " " previouslyPackagedVersions}; do
              for curr_version in ${lib.concatStringsSep " " versions}; do
                if [[ "$(printf '%s\n%s' "$prev_version" "$curr_version" | sort -V | head -n1)" == "$prev_version" ]] && [[ "$prev_version" != "$curr_version" ]]; then
                  main_sql_file="$out/share/postgresql/extension/wrappers--$curr_version.sql"
                  new_file="$out/share/postgresql/extension/wrappers--$prev_version--$curr_version.sql"
                  # Only create if it doesn't already exist (first loop may have created it)
                  if [ -f "$main_sql_file" ] && [ ! -f "$new_file" ]; then
                    cp "$main_sql_file" "$new_file"
                    sed -i 's|$libdir/wrappers-[0-9.]*|$libdir/wrappers|g' "$new_file"
                  fi
                fi
              done
            done
          }
        ''
    }

    create_control_files
    create_lib_files
    ${if latestOnly then "" else "create_migration_sql_files"}

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_${pname}_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"

    # Verify library count matches expected
    ${
      if latestOnly then
        ''
          (test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "2")
        ''
      else
        ''
          (test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
            toString (numberOfVersions + numberOfPreviouslyPackagedVersions + 1)
          }")
        ''
    }
  '';
  passthru = {
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    pname = "${pname}";
    inherit latestOnly;
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
    # Expose individual packages for CI to build separately
    packages = packagesAttrSet // {
      recurseForDerivations = true;
    };
  };
}).overrideAttrs
  (_: {
    requiredSystemFeatures = [ "big-parallel" ];
  })
