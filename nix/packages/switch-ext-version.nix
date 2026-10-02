{
  coreutils,
  overlayfs-on-package,
  lib,
  postgresql,
  writeShellApplication,
}:
writeShellApplication {
  name = "switch-ext-version";
  runtimeInputs = [ coreutils ];
  text = ''
    # Create version switcher script
    set -euo pipefail

    # Check if the required environment variables are set
    if [ -z "''${EXT_NAME:-}" ]; then
      echo "Error: EXT_NAME environment variable is not set."
      exit 1
    fi

    if [ -z "''${EXT_WRAPPER:-}" ]; then
      echo "Error: EXT_WRAPPER environment variable is not set."
      exit 1
    fi

    if [ $# -ne 1 ]; then
      echo "Usage: $0 <version>"
      echo "Example: $0 0.10.0"
      echo ""
      echo "Optional environment variables:"
      echo "  NIX_PROFILE - Path to nix profile (default: /var/lib/postgresql/.nix-profile)"
      echo "  LIB_DIR - Override library directory"
      echo "  EXTENSION_DIR - Override extension directory"
      echo "  LIB_NAME - Override library name"
      exit 1
    fi

    VERSION="$1"

    if [ -z "''${LIB_NAME:-}" ]; then
      LIB_NAME="$EXT_NAME"
    fi

    # Enable overlay on the wrapper package to be able to switch version
    ${lib.getExe overlayfs-on-package} "$EXT_WRAPPER"

    # Check if version exists
    EXT_WRAPPER_LIB="$EXT_WRAPPER/lib"
    EXT_LIB_TO_USE="$EXT_WRAPPER_LIB/$LIB_NAME-$VERSION${postgresql.dlSuffix}"
    if [ ! -f "$EXT_LIB_TO_USE" ]; then
      echo "Error: Version $VERSION not found in $EXT_WRAPPER_LIB"
      echo "Available versions:"
      #shellcheck disable=SC2012
      ls "$EXT_WRAPPER_LIB/$LIB_NAME"-*${postgresql.dlSuffix} 2>/dev/null | sed "s/.*$LIB_NAME-/  /" | sed 's/${postgresql.dlSuffix}$//' || echo "  No versions found"
      exit 1
    fi

    # Update library symlink
    ln -sfnv "$EXT_LIB_TO_USE" "$EXT_WRAPPER_LIB/$LIB_NAME${postgresql.dlSuffix}"

    # Handle extension specific steps
    if [ -x "''${EXTRA_STEPS:-}" ]; then
      #shellcheck disable=SC1090
      source "''${EXTRA_STEPS}"
    fi

    # Update control file
    EXT_WRAPPER_SHARE="$EXT_WRAPPER/share/postgresql/extension"
    echo "default_version = '$VERSION'" > "$EXT_WRAPPER_SHARE/$EXT_NAME.control"
    cat "$EXT_WRAPPER_SHARE/$EXT_NAME--$VERSION.control" >> "$EXT_WRAPPER_SHARE/$EXT_NAME.control"

    echo "Successfully switched $EXT_NAME to version $VERSION"
  '';
}
