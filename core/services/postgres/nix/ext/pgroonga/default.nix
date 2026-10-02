{
  lib,
  stdenv,
  fetchurl,
  pkg-config,
  postgresql,
  msgpack-c,
  mecab,
  makeWrapper,
  xxHash,
  buildEnv,
  supabase-groonga,
  mecab-naist-jdic,
  switch-ext-version,
  latestOnly ? false,
}:
let
  pname = "pgroonga";

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

  # List of C extensions to be included in the build
  cExtensions = [
    "pgroonga"
    "pgroonga_database"
  ];

  # Build function for individual versions
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;

      src = fetchurl {
        url = "https://packages.groonga.org/source/${pname}/${pname}-${version}.tar.gz";
        inherit hash;
      };
      nativeBuildInputs = [
        pkg-config
        makeWrapper
      ];

      buildInputs = [
        postgresql
        msgpack-c
        supabase-groonga
        mecab
      ]
      ++ lib.optionals stdenv.isDarwin [ xxHash ];

      propagatedBuildInputs = [
        supabase-groonga
        mecab-naist-jdic
      ];
      configureFlags = [
        "--with-mecab=${mecab}"
        "--enable-mecab"
        "--with-groonga=${supabase-groonga}"
        "--with-groonga-plugin-dir=${supabase-groonga}/lib/groonga/plugins"
      ];

      makeFlags = [
        "HAVE_MSGPACK=1"
        "MSGPACK_PACKAGE_NAME=msgpack-c"
        "HAVE_MECAB=1"
      ];

      NIX_CFLAGS_COMPILE = lib.optionalString stdenv.isDarwin (
        builtins.concatStringsSep " " [
          "-Wno-error=incompatible-function-pointer-types"
          "-Wno-error=format"
          "-Wno-format"
          "-I${supabase-groonga}/include/groonga"
          "-I${xxHash}/include"
          "-DPGRN_VERSION=\"${version}\""
        ]
      );

      preConfigure = ''
        export GROONGA_LIBS="-L${supabase-groonga}/lib -lgroonga"
        export GROONGA_CFLAGS="-I${supabase-groonga}/include"
        export MECAB_CONFIG="${mecab}/bin/mecab-config"
        export MECAB_DICDIR="${mecab-naist-jdic}/lib/mecab/dic/naist-jdic"
        ${lib.optionalString stdenv.isDarwin ''
          export CPPFLAGS="-I${supabase-groonga}/include/groonga -I${xxHash}/include -DPGRN_VERSION=\"${version}\""
          export CFLAGS="-I${supabase-groonga}/include/groonga -I${xxHash}/include -DPGRN_VERSION=\"${version}\""
          export PG_CPPFLAGS="-Wno-error=incompatible-function-pointer-types -Wno-error=format"
        ''}
      '';

      installPhase = ''
        runHook preInstall

        mkdir -p $out/{lib,share/postgresql/extension}

        for ext in ${lib.concatStringsSep " " cExtensions}; do
          # Install shared library with version suffix
          mv $ext${postgresql.dlSuffix} $out/lib/$ext-${version}${postgresql.dlSuffix}

          # Create version-specific control file
          sed -e "/^default_version =/d" \
              -e "s|^module_pathname = .*|module_pathname = '\$libdir/$ext'|" \
            $ext.control > $out/share/postgresql/extension/$ext--${version}.control

          # Copy SQL file to install the specific version
          cp data/$ext--${version}.sql $out/share/postgresql/extension

          # Create versioned control file with modified module path
          sed -e "/^default_version =/d" \
              -e "s|^module_pathname = .*|module_pathname = '\$libdir/$ext'|" \
            $ext.control > $out/share/postgresql/extension/$ext--${version}.control

          # For the latest version, create default control file and symlink and copy SQL upgrade scripts
          if [[ "${version}" == "${latestVersion}" ]]; then
            {
              echo "default_version = '${version}'"
              cat $out/share/postgresql/extension/$ext--${version}.control
            } > $out/share/postgresql/extension/$ext.control
            ln -sfn $ext-${version}${postgresql.dlSuffix} $out/lib/$ext${postgresql.dlSuffix}
            cp data/$ext--*--*.sql $out/share/postgresql/extension
          fi
        done
      '';

      meta = with lib; {
        description = "A PostgreSQL extension to use Groonga as the index";
        longDescription = ''
          PGroonga is a PostgreSQL extension to use Groonga as the index.
          PostgreSQL supports full text search against languages that use only alphabet and digit.
          It means that PostgreSQL doesn't support full text search against Japanese, Chinese and so on.
          You can use super fast full text search feature against all languages by installing PGroonga into your PostgreSQL.
        '';
        homepage = "https://pgroonga.github.io/";
        changelog = "https://github.com/pgroonga/pgroonga/releases/tag/${version}";
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
    # Verify all expected library files are present
    expectedFiles=${toString ((numberOfVersionsBuilt + 1) * (builtins.length cExtensions))}
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
