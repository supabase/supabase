{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  buildEnv,
  latestOnly ? false,
}:
let
  pname = "pgmq";

  # Load version configuration from external file
  allVersions = (builtins.fromJSON (builtins.readFile ../versions.json)).${pname};

  # Filter versions compatible with current PostgreSQL version
  supportedVersions = lib.filterAttrs (
    _: value: builtins.elem (lib.versions.major postgresql.version) value.postgresql
  ) allVersions;

  # Derived version information
  versions = lib.naturalSort (lib.attrNames supportedVersions);
  latestVersion = lib.last versions;
  versionsToUse =
    if latestOnly then
      { "${latestVersion}" = supportedVersions.${latestVersion}; }
    else
      supportedVersions;
  versionsBuilt = if latestOnly then [ latestVersion ] else versions;
  numberOfVersionsBuilt = builtins.length versionsBuilt;
  packages = builtins.attrValues (lib.mapAttrs (name: value: build name value.hash) versionsToUse);

  # Build function for individual versions
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;
      buildInputs = [ postgresql ];
      src = fetchFromGitHub {
        owner = "tembo-io";
        repo = pname;
        rev = "v${version}";
        inherit hash;
      };

      patches = lib.optionals (version == latestVersion) [
        ./0001-fix-replace-drop_queue-function-if-exists.patch
      ];

      buildPhase = ''
        cd pgmq-extension
      '';

      installPhase = ''
        runHook preInstall

        mkdir -p $out/share/postgresql/extension

        # Create versioned sql install script
        cp sql/${pname}.sql $out/share/postgresql/extension/${pname}--${version}.sql

        # Create versioned control file with modified module path
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}'|" \
          ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control

        # For the latest version, create default control file and symlink and copy SQL upgrade scripts
        if [[ "${version}" == "${latestVersion}" ]]; then
          {
            echo "default_version = '${version}'"
            cat $out/share/postgresql/extension/${pname}--${version}.control
          } > $out/share/postgresql/extension/${pname}.control
          cat >> sql/pgmq--1.5.0--1.5.1.sql <<EOF

        CREATE FUNCTION pgmq._extension_exists(extension_name TEXT)
        RETURNS BOOLEAN
        LANGUAGE SQL
        AS \$\$
        SELECT EXISTS (
            SELECT 1
            FROM pg_extension
            WHERE extname = extension_name
        )
        \$\$;
        EOF
          cp sql/*.sql $out/share/postgresql/extension
        fi

        runHook postInstall
      '';

      meta = with lib; {
        description = "A lightweight message queue. Like AWS SQS and RSMQ but on Postgres.";
        homepage = "https://github.com/tembo-io/pgmq";
        inherit (postgresql.meta) platforms;
        license = licenses.postgresql;
      };
    };
in
buildEnv {
  name = pname;
  paths = packages;

  pathsToLink = [ "/share/postgresql/extension" ];

  passthru = {
    perVersion = lib.mapAttrs (name: value: build name value.hash) versionsToUse;
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit pname latestOnly;
    defaultSettings = {
      search_path = "\"$user\", public, auth, extensions";
    };
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
