{
  pkgs,
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  callPackage,
  latestOnly ? false,
}:

let
  pname = "index_advisor";
  allVersions = (builtins.fromJSON (builtins.readFile ./versions.json)).${pname};
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
  build =
    version: hash:
    stdenv.mkDerivation rec {
      inherit pname version;

      buildInputs = [ postgresql ];

      src = fetchFromGitHub {
        owner = "olirice";
        repo = pname;
        rev = "v${version}";
        inherit hash;
      };

      installPhase = ''
        mkdir -p $out/{lib,share/postgresql/extension}

        create_sql_files() {
          echo "Creating SQL files for previous versions..."
          if [[ "${version}" == "${latestVersion}" ]]; then
            cp *.sql $out/share/postgresql/extension
          fi
        }

        create_control_files() {
          sed -e "/^default_version =/d" \
              -e "s|^module_pathname = .*|module_pathname = '\$libdir/${pname}'|" \
            ${pname}.control > $out/share/postgresql/extension/${pname}--${version}.control

          if [[ "${version}" == "${latestVersion}" ]]; then
            {
              echo "default_version = '${latestVersion}'"
              cat $out/share/postgresql/extension/${pname}--${latestVersion}.control
            } > $out/share/postgresql/extension/${pname}.control
          fi
        }

        create_sql_files
        create_control_files
      '';

      meta = with lib; {
        description = "Recommend indexes to improve query performance in PostgreSQL";
        homepage = "https://github.com/olirice/index_advisor";
        license = licenses.postgresql;
        inherit (postgresql.meta) platforms;
      };
    };
  packages = builtins.attrValues (lib.mapAttrs (name: value: build name value.hash) versionsToUse);
in
pkgs.buildEnv {
  name = pname;
  # Add dependency on hypopg for the extension to work
  paths = packages ++ [ (callPackage ./hypopg.nix { inherit postgresql; }) ];
  pathsToLink = [
    "/lib"
    "/share/postgresql/extension"
  ];

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
