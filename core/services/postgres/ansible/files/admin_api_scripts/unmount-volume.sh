#!/usr/bin/env bash

set -euo pipefail

MOUNT_POINT=${1:-}
DELETE_FLAG=${2:-}

if [[ -z $MOUNT_POINT ]]; then
	echo "Usage: $0 <mount_point> [--delete-dir]"
	echo "Unmount only: sudo ./unmount-volume.sh /data/150008"
	echo "Unmount delete dir: sudo ./unmount-volume.sh /data/150008 --delete-dir"
	exit 1
fi

# Unmount a block device from a specified mount point
# Remove the corresponding entry from /etc/fstab for persistence across reboots

FSTAB_FILE="/etc/fstab"
BACKUP_FILE="/etc/fstab.bak"

if mountpoint -q "$MOUNT_POINT"; then
	echo "Unmounting $MOUNT_POINT"
	umount "$MOUNT_POINT"
else
	echo "$MOUNT_POINT is not currently mounted — skipping umount"
fi

UUID=$(findmnt -no UUID "$MOUNT_POINT" 2>/dev/null || true)

if [[ -n $UUID ]]; then
	echo "Removing UUID=$UUID from $FSTAB_FILE"
	cp "$FSTAB_FILE" "$BACKUP_FILE"
	sed -i "/UUID=${UUID//\//\\/}/d" "$FSTAB_FILE"
else
	echo "Could not find UUID for $MOUNT_POINT — skipping fstab cleanup"
fi

if [[ $DELETE_FLAG == "--delete-dir" ]]; then
	echo "Deleting mount point directory: $MOUNT_POINT"
	rm -rf "$MOUNT_POINT"
fi

echo "Unmount and cleanup complete for $MOUNT_POINT"
