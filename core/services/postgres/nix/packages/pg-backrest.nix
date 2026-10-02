{
  fetchFromGitHub,
  lib,
  pgbackrest,
  stdenv,
  systemdLibs,
}:
pgbackrest.overrideAttrs (
  finalAttrs: prevAttrs: {
    version = "2.59.1";

    src = fetchFromGitHub {
      owner = "pgbackrest";
      repo = "pgbackrest";
      rev = "release/${finalAttrs.version}";
      hash = "sha256-bCHjIQ0WIlvjGg1b4jNwWKzxLg+YIDswKx/Jt6EwAdQ=";
    };

    # 2.59.0 adds an optional libsystemd dependency for systemd notify support.
    # Nonexistent on darwin.
    buildInputs =
      (prevAttrs.buildInputs or [ ]) ++ lib.optional stdenv.hostPlatform.isLinux systemdLibs;
    mesonFlags = (prevAttrs.mesonFlags or [ ]) ++ [
      (lib.mesonEnable "libsystemd" stdenv.hostPlatform.isLinux)
    ];
  }
)
