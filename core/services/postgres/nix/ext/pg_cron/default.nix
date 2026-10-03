{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:
let
  pname = "pg_cron";
  allVersions = (builtins.fromJSON (builtins.readFile ../versions.json)).${pname};
  supportedVersions = lib.filterAttrs (
    _: value: builtins.elem (lib.versions.major postgresql.version) value.postgresql
  ) allVersions;
  versions = lib.naturalSort (lib.attrNames supportedVersions);
  latestVersion = lib.last versions;
  versionsToUse =
    if latestOnly then
      { "${latestVersion}" = supportedVersions.${latestVersion}; }
    else
      supportedVersions;
  versionsBuilt = if latestOnly then [ latestVersion ] else versions;
  numberOfVersionsBuilt = builtins.length versionsBuilt;
  # Legacy bare extversion strings mapped to their schema-identical canonical
  # version. Shared via passthru so the test can't drift from this table.
  legacyVersions = {
    "1.0" = "1.0.0";
    "1.1" = "1.1.0";
    "1.2" = "1.2.0";
    "1.3" = "1.3.1";
    "1.4" = "1.4.0";
    "1.4-1" = "1.4.2";
    "1.5" = "1.5.2";
    "1.6" = "1.6.4";
  };
  legacyAlignmentMigrations = lib.concatStrings (
    lib.mapAttrsToList (legacy: canonical: ''
      cat > $out/share/postgresql/extension/${pname}--${legacy}--${canonical}.sql << 'EOF'
      -- Alignment migration: ${legacy} and ${canonical} are schema-identical.
      EOF
    '') legacyVersions
  );
  build =
    version: versionData:
    stdenv.mkDerivation rec {
      inherit pname version;

      buildInputs = [ postgresql ];

      src = fetchFromGitHub {
        owner = "citusdata";
        repo = pname;
        rev = versionData.rev or "v${version}";
        hash = versionData.hash;
      };

      patches = map (p: ./. + "/${p}") (versionData.patches or [ ]);

      buildPhase = ''
        make PG_CONFIG=${postgresql}/bin/pg_config
      '';

      installPhase = ''
        mkdir -p $out/{lib,share/postgresql/extension}

        # Install versioned library
        install -Dm755 ${pname}${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}


        if [[ "${version}" == "${latestVersion}" ]]; then
          cp ${pname}.sql $out/share/postgresql/extension/${pname}--1.0.0.sql
          # Install upgrade scripts
          find . -name 'pg_cron--*--*.sql' -exec install -Dm644 {} $out/share/postgresql/extension/ \;
          mv $out/share/postgresql/extension/pg_cron--1.0--1.1.sql $out/share/postgresql/extension/pg_cron--1.0.0--1.1.0.sql
          mv $out/share/postgresql/extension/pg_cron--1.1--1.2.sql $out/share/postgresql/extension/pg_cron--1.1.0--1.2.0.sql
          mv $out/share/postgresql/extension/pg_cron--1.2--1.3.sql $out/share/postgresql/extension/pg_cron--1.2.0--1.3.1.sql
          mv $out/share/postgresql/extension/pg_cron--1.3--1.4.sql $out/share/postgresql/extension/pg_cron--1.3.1--1.4.0.sql
          mv $out/share/postgresql/extension/pg_cron--1.4--1.4-1.sql $out/share/postgresql/extension/pg_cron--1.4.0--1.4.1.sql
          cat > $out/share/postgresql/extension/pg_cron--1.4.1--1.4.2.sql << 'EOF'
        -- Alignment migration: 1.4.1 and 1.4.2 are schema-identical.
        EOF
          mv $out/share/postgresql/extension/pg_cron--1.4-1--1.5.sql $out/share/postgresql/extension/pg_cron--1.4.2--1.5.2.sql
          mv $out/share/postgresql/extension/pg_cron--1.5--1.6.sql $out/share/postgresql/extension/pg_cron--1.5.2--1.6.4.sql
          ${legacyAlignmentMigrations}
        fi

        # Create versioned control file with modified module path
        sed -e "/^default_version =/d" \
            -e "/^schema =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}'|" \
          ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control
      '';

      meta = with lib; {
        description = "Run Cron jobs through PostgreSQL";
        homepage = "https://github.com/citusdata/pg_cron";
        changelog = "https://github.com/citusdata/pg_cron/raw/v${version}/CHANGELOG.md";
        platforms = postgresql.meta.platforms;
        license = licenses.postgresql;
      };
    };
  packages = builtins.attrValues (lib.mapAttrs (name: value: build name value) versionsToUse);
in
buildEnv {
  name = pname;
  paths = packages;
  nativeBuildInputs = [ makeWrapper ];

  pathsToLink = [
    "/lib"
    "/share/postgresql/extension"
  ];

  postBuild = ''
    {
      echo "default_version = '${latestVersion}'"
      cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
    } > $out/share/postgresql/extension/${pname}.control
    ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

    # checks
    (set -x
       test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
         toString (numberOfVersionsBuilt + 1)
       }"
    )

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_pg_cron_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"
  '';

  meta = with lib; {
    description = "Run Cron jobs through PostgreSQL (multi-version compatible)";
    homepage = "https://github.com/citusdata/pg_cron";
    platforms = postgresql.meta.platforms;
    license = licenses.postgresql;
  };

  passthru = {
    perVersion = lib.mapAttrs (name: value: build name value) versionsToUse;
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit switch-ext-version latestOnly;
    hasBackgroundWorker = true;
    inherit legacyVersions;
    defaultSettings = {
      shared_preload_libraries = [ "pg_cron" ];
      "cron.database_name" = "postgres";
    };
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
