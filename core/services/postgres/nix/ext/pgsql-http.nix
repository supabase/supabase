{
  pkgs,
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  curl,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:
let
  pname = "http";

  # Load version configuration from external file
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).${pname};

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
      # Use major.minor version for filenames (e.g., 1.5 instead of 1.5.0)
      fileVersion = lib.versions.majorMinor version;

      buildInputs = [
        curl
        postgresql
      ];

      src = fetchFromGitHub {
        owner = "pramsey";
        repo = "pgsql-http";
        rev = "refs/tags/v${version}";
        inherit hash;
      };

      installPhase = ''
        runHook preInstall

        mkdir -p $out/{lib,share/postgresql/extension}

        # Install versioned library (single dash for switch-ext-version compatibility)
        install -Dm755 ${pname}${postgresql.dlSuffix} $out/lib/${pname}-${fileVersion}${postgresql.dlSuffix}

        cp ${pname}--${fileVersion}.sql $out/share/postgresql/extension/${pname}--${fileVersion}.sql

        # Create versioned control file with modified module path
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}'|" \
          ${pname}.control > $out/share/postgresql/extension/${pname}--${fileVersion}.control

        # For the latest version, create default control file and symlink and copy SQL upgrade scripts
        if [[ "${version}" == "${latestVersion}" ]]; then
          {
            echo "default_version = '${fileVersion}'"
            cat $out/share/postgresql/extension/${pname}--${fileVersion}.control
          } > $out/share/postgresql/extension/${pname}.control
          ln -sfn ${pname}-${fileVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}
          cp *.sql $out/share/postgresql/extension
        fi

        runHook postInstall
      '';

      meta = with lib; {
        description = "HTTP client for Postgres";
        homepage = "https://github.com/pramsey/${pname}";
        inherit (postgresql.meta) platforms;
        license = licenses.postgresql;
      };
    };
in
pkgs.buildEnv {
  name = pname;
  paths = packages;
  nativeBuildInputs = [ makeWrapper ];
  pathsToLink = [
    "/lib"
    "/share/postgresql/extension"
  ];
  postBuild = ''
    # Verify all expected library files are present
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
  };
}
