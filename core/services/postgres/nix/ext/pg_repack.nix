{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  postgresqlTestHook,
  testers,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:
let
  pname = "pg_repack";

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
    stdenv.mkDerivation (finalAttrs: {
      inherit pname version;

      buildInputs = postgresql.buildInputs ++ [ postgresql ];

      src = fetchFromGitHub {
        owner = "reorg";
        repo = "pg_repack";
        rev = "ver_${finalAttrs.version}";
        inherit hash;
      };

      installPhase = ''
        mkdir -p $out/{lib,share/postgresql/extension,bin}

        mv bin/${pname} $out/bin/${pname}-${version}

        # Install shared library with version suffix
        mv lib/${pname}${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}

        # Create version-specific control file
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}-${version}'|" \
          lib/${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control

        # Copy SQL install script
        cp lib/${pname}--${version}.sql $out/share/postgresql/extension

        # For the latest version, create default control file and symlink and copy SQL upgrade scripts
        if [[ "${version}" == "${latestVersion}" ]]; then
          {
            echo "default_version = '${version}'"
            cat $out/share/postgresql/extension/${pname}--${version}.control
          } > $out/share/postgresql/extension/${pname}.control
          ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}
          ln -sfn $out/bin/${pname}-${latestVersion} $out/bin/${pname}
        fi
        #install -D bin/pg_repack -t $out/bin/
        #install -D lib/pg_repack${postgresql.dlSuffix} -t $out/lib/
        #install -D lib/{pg_repack--${finalAttrs.version}.sql,pg_repack.control} -t $out/share/postgresql/extension
      '';

      passthru.tests = {
        version = testers.testVersion { package = finalAttrs.finalPackage; };
        extension = stdenv.mkDerivation {
          name = "plpgsql-check-test";
          dontUnpack = true;
          doCheck = true;
          buildInputs = [ postgresqlTestHook ];
          nativeCheckInputs = [ (postgresql.withPackages (ps: [ ps.pg_repack ])) ];
          postgresqlTestUserOptions = "LOGIN SUPERUSER";
          failureHook = "postgresqlStop";
          checkPhase = ''
            runHook preCheck
            psql -a -v ON_ERROR_STOP=1 -c "CREATE EXTENSION pg_repack;"
            runHook postCheck
          '';
          installPhase = "touch $out";
        };
      };

      meta = with lib; {
        description = "Reorganize tables in PostgreSQL databases with minimal locks";
        longDescription = ''
          pg_repack is a PostgreSQL extension which lets you remove bloat from tables and indexes, and optionally restore
          the physical order of clustered indexes. Unlike CLUSTER and VACUUM FULL it works online, without holding an
          exclusive lock on the processed tables during processing. pg_repack is efficient to boot,
          with performance comparable to using CLUSTER directly.
        '';
        homepage = "https://github.com/reorg/pg_repack";
        license = licenses.bsd3;
        inherit (postgresql.meta) platforms;
        mainProgram = "pg_repack";
      };
    });
in
buildEnv {
  name = pname;
  paths = packages;
  nativeBuildInputs = [ makeWrapper ];

  pathsToLink = [
    "/bin"
    "/lib"
    "/share/postgresql/extension"
  ];

  postBuild = ''
    # Verify all expected library files are present
    expectedFiles=${toString (numberOfVersionsBuilt + 1)}
    actualFiles=$(ls -l $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)

    if [[ "$actualFiles" != "$expectedFiles" ]]; then
      echo "Error: Expected $expectedFiles library files, found $actualFiles"
      echo "Files found:"
      ls -la $out/lib/*${postgresql.dlSuffix} || true
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
