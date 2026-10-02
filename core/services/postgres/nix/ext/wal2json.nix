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
  pname = "wal2json";
  build =
    version: _rev: hash:
    stdenv.mkDerivation rec {
      inherit version pname;

      src = fetchFromGitHub {
        owner = "eulerto";
        repo = "wal2json";
        rev = "wal2json_${builtins.replaceStrings [ "." ] [ "_" ] version}";
        inherit hash;
      };

      buildInputs = [ postgresql ];

      makeFlags = [ "USE_PGXS=1" ];

      installPhase = ''
        runHook preInstall

        mkdir -p $out/share/postgresql/extension

        # Install versioned library
        install -Dm755 ${pname}${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}
        if [[ "${version}" == "${latestVersion}" ]]; then
          cp sql/*.sql $out/share/postgresql/extension/
        fi

        touch $out/share/postgresql/extension/${pname}--${version}.control
        touch $out/share/postgresql/extension/${pname}--${version}.sql

        runHook postInstall
      '';

      meta = with lib; {
        description = "PostgreSQL JSON output plugin for changeset extraction";
        homepage = "https://github.com/eulerto/wal2json";
        changelog = "https://github.com/eulerto/wal2json/releases/";
        platforms = postgresql.meta.platforms;
        license = licenses.bsd3;
      };
    };
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).wal2json;
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
    lib.mapAttrs (name: value: build name value.rev value.hash) versionsToUse
  );
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
    ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

    {
      echo "default_version = '${latestVersion}'"
    } > $out/share/postgresql/extension/${pname}.control

    # Create empty upgrade files between consecutive versions
    # plpgsql_check ships without upgrade scripts - extensions are backward-compatible
    previous_version=""
    for ver in ${lib.concatStringsSep " " versions}; do
      if [[ -n "$previous_version" ]]; then
        touch $out/share/postgresql/extension/${pname}--''${previous_version}--''${ver}.sql
      fi
      previous_version=$ver
    done

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_${pname}_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"

    # checks
    (set -x
       test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
         toString (numberOfVersionsBuilt + 1)
       }"
    )
  '';

  passthru = {
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit pname latestOnly;
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
    defaultSettings = {
      wal_level = "logical";
      # PG 15.19 / 17.11+ only load output plugins named here (CVE-2026-6471);
      output_plugin_libraries = "pgoutput, test_decoding, wal2json";
    };
  };
}
