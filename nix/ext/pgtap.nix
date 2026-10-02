{
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  perl,
  perlPackages,
  which,
  buildEnv,
  fetchpatch2,
  makeWrapper,
  switch-ext-version,
}:
let
  pname = "pgtap";

  # Load version configuration from external file
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).${pname};

  # Filter versions compatible with current PostgreSQL version
  supportedVersions = lib.filterAttrs (
    _: value: builtins.elem (lib.versions.major postgresql.version) value.postgresql
  ) allVersions;

  # Derived version information
  versions = lib.naturalSort (lib.attrNames supportedVersions);
  latestVersion =
    assert lib.assertMsg (
      versions != [ ]
    ) "pgtap: no supported versions for PostgreSQL ${lib.versions.major postgresql.version}";
    lib.last versions;
  numberOfVersions = builtins.length versions;
  packages = builtins.attrValues (
    lib.mapAttrs (name: value: build name value.hash) supportedVersions
  );
  repoOwner = "theory";

  # Build function for individual versions
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;

      src = fetchFromGitHub {
        owner = repoOwner;
        repo = pname;
        rev = "v${version}";
        inherit hash;
      };

      nativeBuildInputs = [
        postgresql
        perl
        perlPackages.TAPParserSourceHandlerpgTAP
        which
      ];

      patches = lib.optionals (version == "1.3.3") [
        # Fix error in upgrade script from 1.2.0 to 1.3.3
        (fetchpatch2 {
          name = "pgtap-fix-upgrade-from-1.2.0-to-1.3.3.patch";
          url = "https://github.com/${repoOwner}/${pname}/pull/338.diff?full_index=1";
          hash = "sha256-AVRQyqCGoc0gcoMRWBJKMmUBjadGtWg7rvHmTq5rRpw=";
        })
      ];

      installPhase = ''
        runHook preInstall

        mkdir -p $out/{lib,share/postgresql/extension}

        # Create version-specific control file
        if [[ -f src/pgtap${postgresql.dlSuffix} ]]; then
          # For versions with shared library, set module_pathname
          ext="$out/lib/${pname}-${version}${postgresql.dlSuffix}"
          sed -e "/^default_version =/d" \
              -e "s|^module_pathname = .*|module_pathname = '$ext'|" \
            ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control
        else
          # For SQL-only versions, remove module_pathname line entirely
          sed -e "/^default_version =/d" \
              -e "/^module_pathname =/d" \
            ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control
        fi

        # Copy SQL file to install the specific version
        cp sql/${pname}--${version}.sql $out/share/postgresql/extension

        if [[ -f src/pgtap${postgresql.dlSuffix} ]]; then
          # Install the shared library with version suffix
          install -Dm755 src/pgtap${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}
        fi

        # For the latest version, create default control file and symlink and copy SQL upgrade scripts
        if [[ "${version}" == "${latestVersion}" ]]; then
          {
            echo "default_version = '${version}'"
            cat $out/share/postgresql/extension/${pname}--${version}.control
          } > $out/share/postgresql/extension/${pname}.control
          cp sql/${pname}--*--*.sql $out/share/postgresql/extension
        elif [[ "${version}" == "1.3.1" ]]; then
          # 1.3.1 is the first and only version with a C extension
          ln -sfn ${pname}-${version}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}
        fi
      '';

      meta = with lib; {
        description = "A unit testing framework for PostgreSQL";
        longDescription = ''
          pgTAP is a unit testing framework for PostgreSQL written in PL/pgSQL and PL/SQL.
          It includes a comprehensive collection of TAP-emitting assertion functions,
          as well as the ability to integrate with other TAP-emitting test frameworks.
          It can also be used in the xUnit testing style.
        '';
        homepage = "https://pgtap.org";
        inherit (postgresql.meta) platforms;
        license = licenses.mit;
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
    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_${pname}_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"
  '';

  passthru = {
    inherit versions numberOfVersions;
    pname = "${pname}-all";
    version =
      "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
