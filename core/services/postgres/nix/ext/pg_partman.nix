{
  pkgs,
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  makeWrapper,
  switch-ext-version,
  latestOnly ? false,
}:

let
  pname = "pg_partman";
  libName = "pg_partman_bgw";
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;

      buildInputs = [ postgresql ];

      src = fetchFromGitHub {
        owner = "pgpartman";
        repo = pname;
        rev = "refs/tags/v${version}";
        inherit hash;
      };

      installPhase = ''
        mkdir -p $out/{lib,share/postgresql/extension}

        # Install versioned library
        install -Dm755 src/${libName}${postgresql.dlSuffix} $out/lib/${libName}-${version}${postgresql.dlSuffix}

        # Only install SQL files for the latest version
        if [[ "${version}" == "${latestVersion}" ]]; then
          # Install all SQL files from sql/ directory
          cp -r sql/* $out/share/postgresql/extension/

          # Install upgrade scripts
          cp updates/* $out/share/postgresql/extension/
        fi

        # Create versioned control file with modified module path
        sed -e "/^default_version =/d" \
            -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}'|" \
          ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control
      '';

      meta = with lib; {
        description = "Partition management extension for PostgreSQL";
        homepage = "https://github.com/pgpartman/pg_partman";
        changelog = "https://github.com/pgpartman/pg_partman/blob/v${version}/CHANGELOG.md";
        platforms = postgresql.meta.platforms;
        license = licenses.postgresql;
      };
    };
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).pg_partman;
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
  packages = builtins.attrValues (lib.mapAttrs (name: value: build name value.hash) versionsToUse);
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
    {
      echo "default_version = '${latestVersion}'"
      cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
    } > $out/share/postgresql/extension/${pname}.control
    ln -sfn ${libName}-${latestVersion}${postgresql.dlSuffix} $out/lib/${libName}${postgresql.dlSuffix}


    # checks
    (set -x
       test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
         toString (numberOfVersionsBuilt + 1)
       }"
    )

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_pg_partman_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}" --prefix LIB_NAME : "${libName}"
  '';

  passthru = {
    perVersion = lib.mapAttrs (name: value: build name value.hash) versionsToUse;
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit switch-ext-version libName latestOnly;
    pname = "${pname}-all";
    hasBackgroundWorker = true;
    defaultSchema = "partman";
    defaultSettings = {
      shared_preload_libraries = [ libName ];
    };
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
