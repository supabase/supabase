{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  perl,
  cmake,
  boost,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:
let
  pname = "pgrouting";

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

      nativeBuildInputs = [
        cmake
        perl
      ];
      buildInputs = [
        postgresql
        boost
      ];

      src = fetchFromGitHub {
        owner = "pgRouting";
        repo = pname;
        rev = "v${version}";
        inherit hash;
      };

      patches = lib.optionals (version == "3.4.1" && lib.versionAtLeast postgresql.version "17") [
        ./pgrouting-3.4.1-pg17.patch
      ];

      #disable compile time warnings for incompatible pointer types only on macos and pg16
      NIX_CFLAGS_COMPILE = lib.optionalString (
        stdenv.isDarwin && lib.versionAtLeast postgresql.version "16"
      ) "-Wno-error=int-conversion -Wno-error=incompatible-pointer-types";

      cmakeFlags = [
        "-DPOSTGRESQL_VERSION=${postgresql.version}"
        "-DCMAKE_POLICY_VERSION_MINIMUM=3.5"
      ]
      ++ lib.optionals (stdenv.isDarwin && lib.versionAtLeast postgresql.version "16") [
        "-DCMAKE_MACOSX_RPATH=ON"
        "-DCMAKE_SHARED_MODULE_SUFFIX=.dylib"
        "-DCMAKE_SHARED_LIBRARY_SUFFIX=.dylib"
      ];

      preConfigure = lib.optionalString (stdenv.isDarwin && lib.versionAtLeast postgresql.version "16") ''
        export DLSUFFIX=.dylib
        export CMAKE_SHARED_LIBRARY_SUFFIX=.dylib
        export CMAKE_SHARED_MODULE_SUFFIX=.dylib
        export MACOSX_RPATH=ON
      '';

      postBuild = lib.optionalString (stdenv.isDarwin && lib.versionAtLeast postgresql.version "16") ''
        shopt -s nullglob
        for file in lib/libpgrouting-*.so; do
          if [ -f "$file" ]; then
            mv "$file" "''${file%.so}.dylib"
          fi
        done
        shopt -u nullglob
      '';

      installPhase = ''
        MAJ_MIN_VERSION=${lib.concatStringsSep "." (lib.take 2 (builtins.splitVersion version))}

        mkdir -p $out/{lib,share/postgresql/extension}

        # Install shared library with version suffix
        install -D lib/libpgrouting-$MAJ_MIN_VERSION${postgresql.dlSuffix} -t $out/lib

        # Create version-specific control file
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/lib${pname}-$MAJ_MIN_VERSION'|" \
          sql/common/${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control

        # Copy SQL upgrade scripts
        cp sql/${pname}--*.sql $out/share/postgresql/extension

        if [[ "${version}" == "${latestVersion}" ]]; then
          {
            echo "default_version = '${version}'"
            cat $out/share/postgresql/extension/${pname}--${version}.control
          } > $out/share/postgresql/extension/${pname}.control
          ln -sfn $out/lib/lib${pname}-$MAJ_MIN_VERSION${postgresql.dlSuffix} $out/lib/lib${pname}${postgresql.dlSuffix}
        fi
      '';

      meta = with lib; {
        description = "A PostgreSQL/PostGIS extension that provides geospatial routing functionality";
        homepage = "https://pgrouting.org/";
        changelog = "https://github.com/pgRouting/pgrouting/releases/tag/v${version}";
        license = licenses.gpl2Plus;
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
    #Verify all expected library files are present
    expectedFiles=${toString (numberOfVersionsBuilt + 1)}
    actualFiles=$(ls -l $out/lib/lib${pname}*${postgresql.dlSuffix} | wc -l)

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
