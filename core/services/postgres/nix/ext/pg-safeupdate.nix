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
  pname = "safeupdate";
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;

      buildInputs = [ postgresql ];

      src = fetchFromGitHub {
        owner = "eradman";
        repo = pname;
        rev = version;
        inherit hash;
      };

      installPhase = ''
        runHook preInstall

        mkdir -p $out/share/postgresql/extension

        # Install versioned library
        install -Dm755 ${pname}${postgresql.dlSuffix} $out/lib/${pname}-${version}${postgresql.dlSuffix}

        runHook postInstall
      '';

      meta = with lib; {
        description = "A simple extension to PostgreSQL that requires criteria for UPDATE and DELETE";
        homepage = "https://github.com/eradman/pg-safeupdate";
        changelog = "https://github.com/eradman/pg-safeupdate/raw/${src.rev}/NEWS";
        platforms = postgresql.meta.platforms;
        license = licenses.postgresql;
        broken = versionOlder postgresql.version "14";
      };
    };
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).safeupdate;
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
    ln -sfn ${pname}-${latestVersion}${postgresql.dlSuffix} $out/lib/${pname}${postgresql.dlSuffix}

    # checks
    (set -x
       test "$(ls -A $out/lib/${pname}*${postgresql.dlSuffix} | wc -l)" = "${
         toString (numberOfVersionsBuilt + 1)
       }"
    )

    makeWrapper ${lib.getExe switch-ext-version} $out/bin/switch_${pname}_version \
      --prefix EXT_WRAPPER : "$out" --prefix EXT_NAME : "${pname}"
  '';

  passthru = {
    perVersion = lib.mapAttrs (name: value: build name value.hash) versionsToUse;
    versions = versionsBuilt;
    numberOfVersions = numberOfVersionsBuilt;
    inherit pname latestOnly;
    defaultSettings = {
      shared_preload_libraries = [ "safeupdate" ];
    };
    pgRegressTestName = "pg-safeupdate";
    version =
      if latestOnly then
        latestVersion
      else
        "multi-" + lib.concatStringsSep "-" (map (v: lib.replaceStrings [ "." ] [ "-" ] v) versions);
  };
}
