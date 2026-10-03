{ writeShellApplication, coreutils }:
writeShellApplication {
  name = "overlayfs-on-package";
  runtimeInputs = [ coreutils ];
  text = ''
    # This script enable overlayfs on a specific nix store path
    set -euo pipefail

    if [ $# -ne 1 ]; then
      echo "Usage: $0 <path>"
      exit 1
    fi

    PACKAGE_PATH="$1"
    PACKAGE_NAME=$(basename "$1"|cut -c 34-)

    # Nixos compatibility: use systemd mount unit
    #shellcheck disable=SC1091
    source /etc/os-release || true
    if [[ "$ID" == "nixos" ]]; then
      # This script is used in NixOS test only for the moment
      SYSTEMD_DIR="/run/systemd/system"
    else
      SYSTEMD_DIR="/etc/systemd/system"
    fi

    # Create required directories for overlay
    echo "$PACKAGE_NAME"
    mkdir -p "/var/lib/overlay/$PACKAGE_NAME/"{upper,work}

    PACKAGE_MOUNT_PATH=$(systemd-escape -p --suffix=mount "$PACKAGE_PATH")

    cat > "$SYSTEMD_DIR/$PACKAGE_MOUNT_PATH" <<EOF
    [Unit]
    Description=Overlay mount for PostgreSQL extension $PACKAGE_NAME

    [Mount]
    What=overlay
    Type=overlay
    Options=lowerdir=$PACKAGE_PATH,upperdir=/var/lib/overlay/$PACKAGE_NAME/upper,workdir=/var/lib/overlay/$PACKAGE_NAME/work

    [Install]
    WantedBy=multi-user.target
    EOF

    systemctl daemon-reload
    systemctl start "$PACKAGE_MOUNT_PATH"
  '';
}
