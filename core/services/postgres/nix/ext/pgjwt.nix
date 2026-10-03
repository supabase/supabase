{
  buildEnv,
  lib,
  stdenv,
  fetchFromGitHub,
  postgresql,
  unstableGitUpdater,
  latestOnly ? false,
}:
let
  pname = "pgjwt";
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
    version: hash: revision:
    stdenv.mkDerivation {
      inherit pname version;

      src = fetchFromGitHub {
        owner = "michelp";
        repo = "pgjwt";
        rev = revision;
        inherit hash;
      };

      dontBuild = true;
      installPhase = ''
        mkdir -p $out/share/postgresql/extension
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

      passthru.updateScript = unstableGitUpdater { };

      meta = with lib; {
        description = "PostgreSQL implementation of JSON Web Tokens";
        longDescription = ''
          sign() and verify() functions to create and verify JSON Web Tokens.
        '';
        license = licenses.mit;
        platforms = postgresql.meta.platforms;
      };
    };
  packages = builtins.attrValues (
    lib.mapAttrs (name: value: build name value.hash value.revision) versionsToUse
  );
in
buildEnv {
  name = pname;
  paths = packages;
  pathsToLink = [ "/share/postgresql/extension" ];

  passthru = {
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
