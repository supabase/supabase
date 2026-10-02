{
  lib,
  stdenv,
  buildEnv,
  fetchFromGitHub,
  libkrb5,
  openssl,
  postgresql,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:
#adapted from https://github.com/NixOS/nixpkgs/blob/master/pkgs/servers/sql/postgresql/ext/pgaudit.nix
let
  pname = "pgaudit";
  # Load version configuration from external file
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).${pname};

  # Filter versions compatible with current PostgreSQL version (these get libraries)
  supportedVersions = lib.filterAttrs (
    _: value: builtins.elem (lib.versions.major postgresql.version) value.postgresql
  ) allVersions;

  # Derived version information
  # All versions sorted (for SQL migration files)
  allVersionsList = lib.naturalSort (lib.attrNames allVersions);
  # Supported versions sorted (for libraries)
  versions = lib.naturalSort (lib.attrNames supportedVersions);
  latestVersion = lib.last versions;
  versionsToUse =
    if latestOnly then
      { "${latestVersion}" = supportedVersions.${latestVersion}; }
    else
      supportedVersions;
  versionsBuilt = if latestOnly then [ latestVersion ] else versions;
  numberOfVersionsBuilt = builtins.length versionsBuilt;

  # Build packages only for supported versions (with libraries)
  packages = builtins.attrValues (lib.mapAttrs (name: value: build name value.hash) versionsToUse);

  # Helper function to generate migration SQL file pairs
  # Returns a list of {from, to} pairs for sequential migrations
  generateMigrationPairs =
    versions:
    let
      indexed = lib.imap0 (i: v: {
        idx = i;
        version = v;
      }) versions;
      pairs = lib.filter (x: x.idx > 0) indexed;
    in
    map (curr: {
      from = (lib.elemAt versions (curr.idx - 1));
      to = curr.version;
    }) pairs;

  # All migration pairs across all versions (sequential)
  allMigrationPairs = generateMigrationPairs allVersionsList;

  # Get the first supported version for this PG major
  firstSupportedVersion = lib.head versions;

  # Generate bridge migrations from unsupported versions to first supported version
  # These are needed when upgrading PostgreSQL major versions
  # Only include versions that come BEFORE the first supported version (no backwards migrations)
  unsupportedVersions = lib.filter (
    v: !(builtins.elem v versions) && (lib.versionOlder v firstSupportedVersion)
  ) allVersionsList;
  bridgeMigrations = map (v: {
    from = v;
    to = firstSupportedVersion;
  }) unsupportedVersions;

  # Build function for individual pgaudit versions
  build =
    version: hash:
    stdenv.mkDerivation {
      inherit pname version;

      src = fetchFromGitHub {
        owner = "pgaudit";
        repo = "pgaudit";
        rev = version;
        inherit hash;
      };

      buildInputs = [
        libkrb5
        openssl
        postgresql
      ];

      makeFlags = [ "USE_PGXS=1" ];

      postBuild =
        lib.optionalString (version == "1.7.0") ''
          mv ${pname}--1.7.sql ${pname}--1.7.0.sql
          cp ${pname}--1.7.0.sql ${pname}--1.6.1--1.7.0.sql
        ''
        + lib.optionalString (version == "1.7.1") ''
          mv ${pname}--1.7--1.7.1.sql ${pname}--1.7.0--1.7.1.sql
        '';

      installPhase = ''
        runHook preInstall

        mkdir -p $out/{lib,share/postgresql/extension}

        # Extract the actual default_version from the control file
        # This is what PostgreSQL will record in pg_extension, not necessarily the git tag
        controlVersion=$(grep "^default_version" ${pname}.control | sed "s/default_version = '\(.*\)'/\1/")
        echo "$controlVersion" > $out/control_version

        # Install shared library with version suffix
        mv ${pname}${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}

        # Install SQL files with modifications
        sed -i '1s/^/DROP EVENT TRIGGER IF EXISTS pgaudit_ddl_command_end; \n/' *.sql
        sed -i '1s/^/DROP EVENT TRIGGER IF EXISTS pgaudit_sql_drop; \n/' *.sql
        sed -i 's/CREATE FUNCTION/CREATE OR REPLACE FUNCTION/' *.sql
        cp *.sql $out/share/postgresql/extension

        # Create version-specific control file pointing to versioned library
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}'|" \
          ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control

        runHook postInstall
      '';

      meta = with lib; {
        description = "Open Source PostgreSQL Audit Logging";
        homepage = "https://github.com/pgaudit/pgaudit";
        changelog = "https://github.com/pgaudit/pgaudit/releases/tag/${source.version}";
        license = licenses.postgresql;
        inherit (postgresql.meta) platforms;
      };
    };
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
    # Create symlinks to latest version for library and control file
    ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

    # Create default control file pointing to latest
    {
      echo "default_version = '${latestVersion}'"
      cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
    } > $out/share/postgresql/extension/${pname}.control

    # Generate cross-version migration SQL files
    # For each migration pair, if the target version's base SQL exists but we haven't
    # built that version (no library), we need to create migration files to bridge from
    # older versions to the first available version on this PG major
    ${lib.concatMapStringsSep "\n" (pair: ''
      # Check if we need to create migration ${pair.from}--${pair.to}.sql
      if [[ ! -f "$out/share/postgresql/extension/${pname}--${pair.from}--${pair.to}.sql" ]]; then
        # If the target SQL file exists, create the migration by copying it
        if [[ -f "$out/share/postgresql/extension/${pname}--${pair.to}.sql" ]]; then
          cp "$out/share/postgresql/extension/${pname}--${pair.to}.sql" \
             "$out/share/postgresql/extension/${pname}--${pair.from}--${pair.to}.sql"
        fi
      fi
    '') allMigrationPairs}

    # Generate bridge migrations from unsupported versions to first supported version
    # This handles cross-PostgreSQL-major-version upgrades
    ${lib.concatMapStringsSep "\n" (pair: ''
      # Create bridge migration ${pair.from}--${pair.to}.sql if not already present
      if [[ ! -f "$out/share/postgresql/extension/${pname}--${pair.from}--${pair.to}.sql" ]]; then
        # The bridge migration is just a copy of the target version's base SQL
        if [[ -f "$out/share/postgresql/extension/${pname}--${pair.to}.sql" ]]; then
          cp "$out/share/postgresql/extension/${pname}--${pair.to}.sql" \
             "$out/share/postgresql/extension/${pname}--${pair.from}--${pair.to}.sql"
        fi
      fi
    '') bridgeMigrations}

    # Read actual control file versions from each built package
    # This handles cases where git tag differs from control file default_version
    # (e.g., git tag 1.7.0 but control file says default_version = '1.7')
    ${lib.concatMapStringsSep "\n" (pkg: ''
      if [[ -f "${pkg}/control_version" ]]; then
        controlVer=$(cat "${pkg}/control_version")
        echo "Found control version: $controlVer from package ${pkg}"

        # Create migrations from control version to all supported versions on this PG major
        ${lib.concatMapStringsSep "\n" (targetVer: ''
          # Skip if control version equals target version
          if [[ "$controlVer" != "${targetVer}" ]]; then
            # Skip if migration already exists
            if [[ ! -f "$out/share/postgresql/extension/${pname}--$controlVer--${targetVer}.sql" ]]; then
              # Create symlink to migration if target SQL exists
              if [[ -f "$out/share/postgresql/extension/${pname}--${targetVer}.sql" ]]; then
                echo "Creating migration symlink from control version $controlVer to ${targetVer}"
                ln -s "$out/share/postgresql/extension/${pname}--${targetVer}.sql" \
                      "$out/share/postgresql/extension/${pname}--$controlVer--${targetVer}.sql"
              fi
            fi
          fi
        '') versions}
      fi
    '') packages}

    # Special cross-major-version handling for pgaudit 1.7
    # Upstream pgaudit git tag 1.7.0 has control file with default_version = '1.7'
    # Users upgrading from PG 15 to PG 17 will have version 1.7 installed
    # We can't read the control file from PG 15 packages when building PG 17,
    # so we hardcode this known mismatch
    ${lib.concatMapStringsSep "\n" (targetVer: ''
      if [[ ! -f "$out/share/postgresql/extension/${pname}--1.7--${targetVer}.sql" ]]; then
        if [[ -f "$out/share/postgresql/extension/${pname}--${targetVer}.sql" ]]; then
          echo "Creating cross-major migration symlink from pgaudit 1.7 to ${targetVer}"
          ln -s "$out/share/postgresql/extension/${pname}--${targetVer}.sql" \
                "$out/share/postgresql/extension/${pname}--1.7--${targetVer}.sql"
        fi
      fi
    '') versions}

    # Verify all expected library files are present (one per version + symlink)
    expectedFiles=${toString (numberOfVersionsBuilt + 1)}
    actualFiles=$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)

    if [[ "$actualFiles" != "$expectedFiles" ]]; then
      echo "Error: Expected $expectedFiles library files, found $actualFiles"
      echo "Files found:"
      ls -la $out/lib/${pname}*${postgresql.dlSuffix} || true
      exit 1
    fi

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_${pname}_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"
  '';

  passthru = {
    perVersion = lib.mapAttrs (name: value: build name value.hash) versionsToUse;
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit pname latestOnly;
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
    defaultSettings = {
      shared_preload_libraries = "pgaudit";
    };
  };
}
