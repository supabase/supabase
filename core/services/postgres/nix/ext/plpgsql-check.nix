{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  postgresqlTestHook,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:
let
  pname = "plpgsql_check";

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
  packages = builtins.attrValues (
    lib.mapAttrs (name: value: build name value.hash value.revision) versionsToUse
  );

  # Build function for individual versions
  build =
    version: hash: revision:
    stdenv.mkDerivation rec {
      inherit pname version;

      src = fetchFromGitHub {
        owner = "okbob";
        repo = "plpgsql_check";
        rev = "v${revision}";
        inherit hash;
      };

      # Fix build with gcc 15
      env.NIX_CFLAGS_COMPILE = "-std=gnu17";

      buildInputs = [ postgresql ];

      installPhase = ''
        mkdir -p $out/{lib,share/postgresql/extension}

        # Install shared library with version suffix
        mv ${pname}${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}

        # Create version-specific control file
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}-${version}'|" \
          ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control

        # For the latest version, create default control file and symlink and copy SQL upgrade scripts
        if [[ "${version}" == "${latestVersion}" ]]; then
          cp *.sql $out/share/postgresql/extension
        else
          mv ./${pname}--${version}.sql $out/share/postgresql/extension/${pname}--${version}.sql
        fi
      '';

      passthru.tests.extension = stdenv.mkDerivation {
        name = "plpgsql-check-test";
        dontUnpack = true;
        doCheck = true;
        buildInputs = [ postgresqlTestHook ];
        nativeCheckInputs = [ (postgresql.withPackages (ps: [ ps.plpgsql_check ])) ];
        postgresqlTestUserOptions = "LOGIN SUPERUSER";
        failureHook = "postgresqlStop";
        checkPhase = ''
          runHook preCheck
          psql -a -v ON_ERROR_STOP=1 -c "CREATE EXTENSION plpgsql_check;"
          runHook postCheck
        '';
        installPhase = "touch $out";
      };

      meta = with lib; {
        description = "Linter tool for language PL/pgSQL";
        homepage = "https://github.com/okbob/plpgsql_check";
        changelog = "https://github.com/okbob/plpgsql_check/releases/tag/v${version}";
        license = licenses.mit;
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
    {
      echo "default_version = '${latestVersion}'"
      cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
    } > $out/share/postgresql/extension/${pname}.control
    ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

    # Verify all expected library files are present
    expectedFiles=${toString (numberOfVersionsBuilt + 1)}
    actualFiles=$(ls -l $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)

    if [[ "$actualFiles" != "$expectedFiles" ]]; then
      echo "Error: Expected $expectedFiles library files, found $actualFiles"
      echo "Files found:"
      ls -la $out/lib/*${postgresql.dlSuffix} || true
      exit 1
    fi

    # Create empty upgrade files between consecutive versions
    # plpgsql_check ships without upgrade scripts - extensions are backward-compatible
    previous_version=""
    for ver in ${lib.concatStringsSep " " versions}; do
      if [[ -n "$previous_version" ]]; then
        touch $out/share/postgresql/extension/${pname}--''${previous_version}--''${ver}.sql
      fi
      previous_version=$ver
    done

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_plpgsql_check_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"
  '';

  passthru = {
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit switch-ext-version latestOnly;
    hasBackgroundWorker = true;
    defaultSettings = {
      shared_preload_libraries = [
        "plpgsql"
        "plpgsql_check"
      ];
    };
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
