{
  lib,
  stdenv,
  fetchFromGitHub,
  cmake,
  postgresql,
  openssl,
  libkrb5,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  coreutils,
  writeShellApplication,
  latestOnly ? false,
}:

let
  pname = "timescaledb";
  build =
    version: hash: _revision:
    stdenv.mkDerivation rec {
      inherit pname version;

      nativeBuildInputs = [ cmake ];
      buildInputs = [
        postgresql
        openssl
        libkrb5
      ];

      src = fetchFromGitHub {
        owner = "timescale";
        repo = "timescaledb";
        rev = version;
        inherit hash;
      };

      cmakeFlags = [
        "-DSEND_TELEMETRY_DEFAULT=OFF"
        "-DREGRESS_CHECKS=OFF"
        "-DTAP_CHECKS=OFF"
        "-DAPACHE_ONLY=1"
      ]
      ++ lib.optionals stdenv.isDarwin [ "-DLINTER=OFF" ];

      postPatch = ''
        for x in CMakeLists.txt sql/CMakeLists.txt; do
          if [ -f "$x" ]; then
            substituteInPlace "$x" \
              --replace 'DESTINATION "''${PG_SHAREDIR}/extension"' "DESTINATION \"$out/share/postgresql/extension\""
          fi
        done

        for x in src/CMakeLists.txt src/loader/CMakeLists.txt tsl/src/CMakeLists.txt; do
          if [ -f "$x" ]; then
            substituteInPlace "$x" \
              --replace 'DESTINATION ''${PG_PKGLIBDIR}' "DESTINATION \"$out/lib\""
          fi
        done
      '';

      installPhase = ''
        # Run cmake install first
        cmake --install . --prefix=$out

        # TimescaleDB creates two libraries:
        # 1. timescaledb.so (loader) -> rename to timescaledb-<version>-loader.so
        # 2. timescaledb-<version>.so (actual extension) -> keep as is

        # Rename the loader library to be version-specific
        if [ -f $out/lib/timescaledb${postgresql.dlSuffix} ]; then
          mv $out/lib/timescaledb${postgresql.dlSuffix} $out/lib/timescaledb-loader-${version}${postgresql.dlSuffix}
        fi

        # The versioned library (timescaledb-VERSION.so) is already correctly named

        # Create versioned control file with default_version removed and module_pathname pointing to symlink
        if [ -f $out/share/postgresql/extension/timescaledb.control ]; then
          sed -e "/^default_version =/d" \
              -e "s|^module_pathname = .*|module_pathname = '\$libdir/timescaledb'|" \
            $out/share/postgresql/extension/timescaledb.control > $out/share/postgresql/extension/timescaledb--${version}.control
          rm $out/share/postgresql/extension/timescaledb.control
        fi
      '';

      meta = with lib; {
        description = "Scales PostgreSQL for time-series data via automatic partitioning across time and space";
        homepage = "https://www.timescale.com/";
        changelog = "https://github.com/timescale/timescaledb/blob/${version}/CHANGELOG.md";
        license = licenses.asl20;
        inherit (postgresql.meta) platforms;
      };
    };

  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).timescaledb;
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
  packages = builtins.attrValues (
    lib.mapAttrs (name: value: build name value.hash (value.revision or name)) versionsToUse
  );
  switch-timescaledb-loader = writeShellApplication {
    name = "switch_timescaledb_loader";
    runtimeInputs = [ coreutils ];
    text = ''
      EXT_LOADER_TO_USE="$EXT_WRAPPER_LIB/$EXT_NAME-loader-$VERSION${postgresql.dlSuffix}"
      if [ -f "$EXT_LOADER_TO_USE" ]; then
        ln -sfnv "$EXT_LOADER_TO_USE" "$EXT_WRAPPER_LIB/$EXT_NAME${postgresql.dlSuffix}"
        ln -sfnv "$EXT_LOADER_TO_USE" "$EXT_WRAPPER_LIB/$EXT_NAME-loader${postgresql.dlSuffix}"
      fi
    '';
  };
in
buildEnv {
  name = pname;
  paths = packages;
  nativeBuildInputs = [ makeWrapper ];
  postBuild = ''
    {
      echo "default_version = '${latestVersion}'"
      cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
    } > $out/share/postgresql/extension/${pname}.control

    # Create symlink from the latest versioned loader to timescaledb.so
    ln -sfn ${pname}-loader-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

    # Create symlink for timescaledb-loader.so (used by background worker tests)
    ln -sfn ${pname}-loader-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}-loader${postgresql.dlSuffix}

    # The versioned extension libraries (timescaledb-VERSION.so) are already in place

    # checks - we should have loader files and versioned extension files
    (set -x
       test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" -gt 0
    )
    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_timescaledb_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}" --prefix EXTRA_STEPS : ${lib.getExe switch-timescaledb-loader}
  '';

  pathsToLink = [
    "/lib"
    "/share/postgresql/extension"
  ];

  passthru = {
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit switch-ext-version latestOnly;
    hasBackgroundWorker = true;
    libName = "timescaledb-loader";
    defaultSettings = {
      shared_preload_libraries = [ "timescaledb" ];
    };
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
