{
  fetchurl,
  lib,
  stdenv,
  perl,
  libxml2,
  postgresql,
  geos,
  proj,
  json_c,
  pkg-config,
  file,
  protobufc,
  libiconv,
  pcre2,
  nixosTests,
  callPackage,
  buildEnv,
  makeWrapper,
  switch-ext-version,
  writeShellApplication,
  coreutils,
  sfcgal,
  latestOnly ? false,
}:

let
  gdal = callPackage ./gdal.nix { inherit postgresql; };
  pname = "postgis";

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

  # Custom switch script for postgis — handles all sub-libraries with -3 naming.
  # The generic switch-ext-version handles the main postgis library (postgis.so -> postgis-VERSION.so)
  # and control file. This EXTRA_STEPS script handles the -3 symlink plus the 4 additional sub-libraries.
  postgis-switch-extra-steps = writeShellApplication {
    name = "postgis-switch-extra-steps";
    runtimeInputs = [ coreutils ];
    text = ''
      EXT_WRAPPER_LIB="$EXT_WRAPPER/lib"
      CONTROL_DIR="$EXT_WRAPPER/share/postgresql/extension"

      # Repoint the postgis-3 symlink (module_pathname uses $libdir/postgis-3)
      if [ -f "$EXT_WRAPPER_LIB/postgis-''${VERSION}${postgresql.dlSuffix}" ]; then
        ln -sfnv "postgis-''${VERSION}${postgresql.dlSuffix}" "$EXT_WRAPPER_LIB/postgis-3${postgresql.dlSuffix}"
      fi

      # Switch additional sub-libraries
      for ext in postgis_raster postgis_topology postgis_sfcgal address_standardizer; do
        VERSIONED_LIB="$EXT_WRAPPER_LIB/$ext-''${VERSION}${postgresql.dlSuffix}"
        DEFAULT_LIB="$EXT_WRAPPER_LIB/$ext-3${postgresql.dlSuffix}"
        if [ -f "$VERSIONED_LIB" ]; then
          ln -sfnv "$VERSIONED_LIB" "$DEFAULT_LIB"

          # Update control file for this sub-extension
          if [ -f "$CONTROL_DIR/$ext--''${VERSION}.control" ]; then
            echo "default_version = '$VERSION'" > "$CONTROL_DIR/$ext.control"
            cat "$CONTROL_DIR/$ext--''${VERSION}.control" >> "$CONTROL_DIR/$ext.control"
          fi
        else
          echo "Warning: $ext versioned library not found at $VERSIONED_LIB, skipping"
        fi
      done
    '';
  };

  # List of C extensions to be included in the build
  cExtensions = [
    "address_standardizer"
    "postgis"
    "postgis_raster"
    "postgis_sfcgal"
    "postgis_topology"
  ];

  sqlExtensions = [
    "address_standardizer_data_us"
    "postgis_tiger_geocoder"
  ];

  # Build function for individual versions
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;

      outputs = [
        "out"
        "doc"
      ];

      src = fetchurl {
        url = "https://download.osgeo.org/postgis/source/postgis-${version}.tar.gz";
        inherit hash;
      };

      buildInputs = [
        libxml2
        postgresql
        geos
        proj
        gdal
        json_c
        protobufc
        pcre2.dev
        sfcgal
      ]
      ++ lib.optional stdenv.isDarwin libiconv;
      nativeBuildInputs = [
        perl
        pkg-config
      ];
      dontDisableStatic = true;

      env.NIX_LDFLAGS = "-L${lib.getLib json_c}/lib";

      preConfigure = ''
        sed -i 's@/usr/bin/file@${file}/bin/file@' configure
        configureFlags="--datadir=$out/share/postgresql --datarootdir=$out/share/postgresql --bindir=$out/bin --docdir=$doc/share/doc/${pname} --with-gdalconfig=${gdal}/bin/gdal-config --with-jsondir=${json_c.dev} --with-sfcgal"

        makeFlags="PERL=${perl}/bin/perl datadir=$out/share/postgresql pkglibdir=$out/lib bindir=$out/bin docdir=$doc/share/doc/${pname}"
      '';

      postConfigure = ''
        sed -i "s|@mkdir -p \$(DESTDIR)\$(PGSQL_BINDIR)||g ;
                s|\$(DESTDIR)\$(PGSQL_BINDIR)|$prefix/bin|g
                " \
            "raster/loader/Makefile";
        sed -i "s|\$(DESTDIR)\$(PGSQL_BINDIR)|$prefix/bin|g
                " \
            "raster/scripts/python/Makefile";
        mkdir -p $out/bin
        ln -s ${postgresql}/bin/postgres $out/bin/postgres
      '';

      postInstall = ''
        MIN_MAJ_VERSION=${lib.concatStringsSep "." (lib.take 2 (builtins.splitVersion version))}
        rm $out/bin/postgres

        # Rename C extension libraries with full version suffix
        for ext in ${lib.concatStringsSep " " cExtensions}; do
          if [ -f "$out/lib/$ext-3${postgresql.dlSuffix}" ]; then
            mv $out/lib/$ext-3${postgresql.dlSuffix} $out/lib/$ext-${version}${postgresql.dlSuffix}
          fi
        done

        # Create version-specific control files (without default_version, pointing to unversioned library)
        for ext in ${lib.concatStringsSep " " (cExtensions ++ sqlExtensions)}; do
          sed -e "/^default_version =/d" \
              -e "s|^module_pathname = .*|module_pathname = '\$libdir/$ext-3'|" \
            $out/share/postgresql/extension/$ext.control > $out/share/postgresql/extension/$ext--${version}.control
          rm $out/share/postgresql/extension/$ext.control
        done

        # Add function definition and usage to tiger geocoder files
        for file in $out/share/postgresql/extension/postgis_tiger_geocoder*--${version}.sql; do
            sed -i "/SELECT postgis_extension_AddToSearchPath('tiger');/a SELECT postgis_extension_AddToSearchPath('extensions');" "$file"
        done
        # Original topology patching
        for file in $out/share/postgresql/extension/postgis_topology*--${version}.sql; do
          sed -i "/SELECT topology.AddToSearchPath('topology');/i SELECT topology.AddToSearchPath('extensions');" "$file"
        done

        # For the latest version, create default control file and library symlinks
        if [[ "${version}" == "${latestVersion}" ]]; then
          # Copy all SQL upgrade scripts only for latest version
          cp $out/share/postgresql/extension/*.sql $out/share/postgresql/extension/ 2>/dev/null || true

          for ext in ${lib.concatStringsSep " " (cExtensions ++ sqlExtensions)}; do
            {
              echo "default_version = '${version}'"
              cat $out/share/postgresql/extension/$ext--${version}.control
            } > $out/share/postgresql/extension/$ext.control
          done

          # Create symlinks for C extension libraries (latest version becomes the default)
          for ext in ${lib.concatStringsSep " " cExtensions}; do
            ln -sfn $ext-${version}${postgresql.dlSuffix} $out/lib/$ext-3${postgresql.dlSuffix}
          done

          for prog in $out/bin/*; do # */
            ln -s $prog $prog-${version}
          done
        else
          # remove migration scripts for non-latest version
          find $out/share/postgresql/extension -regex '.*--.*--.*\.sql' -delete

          for prog in $out/bin/*; do # */
            mv $prog $prog-${version}
          done
        fi

        mkdir -p $doc/share/doc/postgis
        mv doc/* $doc/share/doc/postgis/
      '';

      passthru.tests.postgis = nixosTests.postgis;

      meta = with lib; {
        description = "Geographic Objects for PostgreSQL";
        homepage = "https://postgis.net/";
        changelog = "https://git.osgeo.org/gitea/postgis/postgis/raw/tag/${version}/NEWS";
        license = licenses.gpl2;
        inherit (postgresql.meta) platforms;
      };
    };
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
    # Verify all expected library files are present
    # We expect: (numberOfVersionsBuilt * cExtensions) versioned libraries + cExtensions symlinks
    expectedFiles=${
      toString ((numberOfVersionsBuilt * builtins.length cExtensions) + builtins.length cExtensions)
    }
    actualFiles=$(ls -A $out/lib/*${postgresql.dlSuffix} | wc -l)

    if [[ "$actualFiles" != "$expectedFiles" ]]; then
      echo "Error: Expected $expectedFiles library files, found $actualFiles"
      echo "Files found:"
      ls -la $out/lib/*${postgresql.dlSuffix} || true
      exit 1
    fi

    # PostGIS has multiple sub-libraries (postgis-3, postgis_raster-3, etc.).
    # The generic switch-ext-version handles the main postgis.so symlink and control file.
    # EXTRA_STEPS repoints the -3 symlinks and switches the 4 additional sub-libraries.
    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_${pname}_version \
      --prefix EXT_WRAPPER : "$out" \
      --prefix EXT_NAME : "${pname}" \
      --prefix EXTRA_STEPS : "${lib.getExe postgis-switch-extra-steps}"
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
}).overrideAttrs
  (_: {
    requiredSystemFeatures = [ "big-parallel" ];
  })
