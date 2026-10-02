#!/usr/bin/env bash
set -euo pipefail

DEVICE=${1:-}
MOUNT_POINT=${2:-}

if [[ -z $DEVICE || -z $MOUNT_POINT ]]; then
	echo "Usage: $0 <device> <mount_point>"
	echo "Example: sudo ./mount-volume.sh /dev/nvme1n1 /data/150008"
	logger "Usage: $0 <device> <mount_point>"
	logger "Example: sudo ./mount-volume.sh /dev/nvme1n1 /data/150008"
	exit 1
fi

OWNER="postgres:postgres"
PERMISSIONS="750"
FSTYPE="ext4"
MOUNT_OPTS="defaults"
FSTAB_FILE="/etc/fstab"
TIMEOUT=60
INTERVAL=2
ELAPSED=0
LOGGER_TAG="mount-volume"

# --- Helper function for echo + logger ---
log() {
	echo "$1"
	logger -t "$LOGGER_TAG" "$1"
}

log "Starting mount procedure for device $DEVICE → $MOUNT_POINT"

# --- Wait for block device ---
log "Waiting for block device $DEVICE to become available..."
while true; do
	if [ -b "$DEVICE" ]; then
		if blkid "$DEVICE" >/dev/null 2>&1 || true; then
			log "$DEVICE is ready"
			break
		fi
	fi

	ELAPSED=$((ELAPSED + INTERVAL))
	if [ $ELAPSED -ge $TIMEOUT ]; then
		log "Error: $DEVICE did not become ready after $TIMEOUT seconds"
		exit 3
	fi

	sleep $INTERVAL
done

# --- Validate device ---
if [ ! -b "$DEVICE" ]; then
	log "Error: Block device '$DEVICE' does not exist."
	exit 2
fi

# --- Safety: refuse to mount over non-empty directory ---
mkdir -p "$MOUNT_POINT"
if [ "$(ls -A "$MOUNT_POINT" 2>/dev/null)" ]; then
	if ! mountpoint -q "$MOUNT_POINT"; then
		log "Error: Mount point $MOUNT_POINT is not empty. Aborting to protect existing data."
		exit 4
	fi
fi

# --- Format if needed ---
if ! blkid "$DEVICE" >/dev/null 2>&1; then
	log "Device $DEVICE appears unformatted. Formatting as $FSTYPE..."
	mkfs."$FSTYPE" -F "$DEVICE"
else
	log "$DEVICE already has a filesystem — skipping format."
fi

# --- Filesystem check ---
if ! mountpoint -q "$MOUNT_POINT"; then
	log "Running e2fsck check on $DEVICE"
	e2fsck -pf "$DEVICE" || log "Warning: e2fsck returned non-zero exit code"
fi

# --- Mount ---
if ! mountpoint -q "$MOUNT_POINT"; then
	log "Mounting $DEVICE to $MOUNT_POINT"
	mount -t "$FSTYPE" -o "$MOUNT_OPTS" "$DEVICE" "$MOUNT_POINT"
else
	log "$MOUNT_POINT is already mounted"
fi

# --- Ownership and permissions ---
log "Setting ownership and permissions on $MOUNT_POINT"
chown "$OWNER" "$MOUNT_POINT"
chmod "$PERMISSIONS" "$MOUNT_POINT"

# --- Persist in /etc/fstab ---
UUID=$(blkid -s UUID -o value "$DEVICE")
FSTAB_LINE="UUID=$UUID  $MOUNT_POINT  $FSTYPE  $MOUNT_OPTS  0  2"

if ! grep -q "$UUID" "$FSTAB_FILE"; then
	log "Adding $FSTAB_LINE to $FSTAB_FILE"
	echo "$FSTAB_LINE" >>"$FSTAB_FILE"
else
	log "UUID $UUID already in $FSTAB_FILE — skipping"
fi

log "Mounted $DEVICE at $MOUNT_POINT with owner=$OWNER and mode=$PERMISSIONS"
