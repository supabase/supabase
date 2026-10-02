#! /usr/bin/env bash

set -euo pipefail

VOLUME_TYPE=${1:-data}

# lsb release
UBUNTU_VERSION=$(lsb_release -rs)

if pgrep resizefs; then
	echo "resize2fs is already running"
	exit 1
fi

# install amazon disk utilities if not present on 24.04
if [ "${UBUNTU_VERSION}" = "24.04" ] && ! /usr/bin/dpkg-query -W amazon-ec2-utils >/dev/null 2>&1; then
	apt-get update
	apt-get install -y amazon-ec2-utils || true
fi

# We currently mount 3 possible disks
# - /dev/xvda (root disk)
# - /dev/xvdh (data disk)
# - /dev/xvdp (upgrade data disk), not used here
# Initialize variables at 20.04 levels
XVDA_DEVICE="/dev/nvme0n1"
XVDH_DEVICE="/dev/nvme1n1"
# Map AWS devices to NVMe for ubuntu 24.04 and later
if [ "${UBUNTU_VERSION}" = "24.04" ] && /usr/bin/dpkg-query -W amazon-ec2-utils >/dev/null 2>&1; then
	for nvme_dev in $(lsblk -dprno name,type | grep disk | awk '{print $1}'); do
		if [ -b "$nvme_dev" ]; then
			mapping=$(ebsnvme-id -b "$nvme_dev" 2>/dev/null)
			case "$mapping" in
			"xvda" | "/dev/xvda") XVDA_DEVICE="$nvme_dev" ;;
			"xvdh" | "/dev/xvdh") XVDH_DEVICE="$nvme_dev" ;;
			esac
		fi
	done
fi

echo "Using devices - Root: $XVDA_DEVICE, Data: $XVDH_DEVICE"

# Get root partition using findmnt
ROOT_DEVICE_FULL=$(findmnt -no SOURCE /)
ROOT_DEVICE=$(lsblk -no PKNAME "$ROOT_DEVICE_FULL")
ROOT_PARTITION_NUMBER=${ROOT_DEVICE_FULL##*"${ROOT_DEVICE}"p}

if ! [[ $ROOT_PARTITION_NUMBER =~ ^[0-9]+$ ]]; then
	echo "Error: ROOT_PARTITION_NUMBER is not a valid number: $ROOT_PARTITION_NUMBER"
	exit 1
fi

if [ -b "${XVDH_DEVICE}" ]; then
	if [[ ${VOLUME_TYPE} == "data" ]]; then
		resize2fs "${XVDH_DEVICE}"

		# Explicitly reserving 100MiB worth of blocks for the data volume
		#
		# This is owned in $GIT_DIR/ebssurrogate/scripts/surrogate-bootstrap-nix.sh
		RESERVED_DATA_VOLUME_BLOCK_COUNT=$((100 * 1024 * 1024 / 4096))
		tune2fs -r $RESERVED_DATA_VOLUME_BLOCK_COUNT "${XVDH_DEVICE}"

	elif [[ ${VOLUME_TYPE} == "root" ]]; then
		PLACEHOLDER_FL=/home/ubuntu/50M_PLACEHOLDER
		rm -f "${PLACEHOLDER_FL}" || true
		growpart "${XVDA_DEVICE}" "${ROOT_PARTITION_NUMBER}"
		resize2fs "${XVDA_DEVICE}p${ROOT_PARTITION_NUMBER}"
		if [[ ! -f ${PLACEHOLDER_FL} ]]; then
			fallocate -l50M "${PLACEHOLDER_FL}"
		fi
	else
		echo "Invalid disk specified: ${VOLUME_TYPE}"
		exit 1
	fi
else
	growpart "${XVDA_DEVICE}" "${ROOT_PARTITION_NUMBER}"
	resize2fs "${XVDA_DEVICE}p${ROOT_PARTITION_NUMBER}"
fi
echo "Done resizing disk"
