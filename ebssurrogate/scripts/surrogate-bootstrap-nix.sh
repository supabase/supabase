#!/usr/bin/env bash
#
# This script creates filesystem and setups up chrooted
# enviroment for further processing. It also runs
# ansible playbook and finally does system cleanup.
#
# Adapted from: https://github.com/jen20/packer-ubuntu-zfs

set -o errexit
set -o pipefail
set -o xtrace

exec 1>&2

function setup_apt {
	export DEBIAN_FRONTEND=noninteractive

	# This function assumes deb822 formatted sources are in use, which is the case in both qemu and aws images
	# In aws cloud-init creates a sources file with regional mirrors for "default" Suites but keeps ubuntu for security suite
	# So we grab the first (only) URI from security and append it to non-security's URI
	# This ends up giving us fastest mirror for installs and falls back to ubuntu if there's an issue
	#
	# Note: Ubuntu amd64 mirrors have different hostnames for security vs non but aarch64 are the same, hence the amd64 specific line

	# ensure deb822 format sources are in use
	tail -n+1 /etc/apt/sources.list /etc/apt/sources.list.d/ubuntu.sources >&2

	local sources defmirror ubumirror
	sources=$(grep -e '^URIs\s*:' -e '^Suites\s*:' /etc/apt/sources.list.d/ubuntu.sources)
	defmirror=$(grep -B1 "$CODENAME-updates" <<<"$sources" | awk '/URIs/ {print $2}')
	ubumirror=$(grep -B1 "$CODENAME-security" <<<"$sources" | awk '/URIs/ {print $2}')
	if [[ $ARCH == amd64 ]]; then
		# amd64 hosts use security.ubuntu.com for security but archive.ubuntu.com for everything else
		ubumirror=${ubumirror/security/archive}
	fi

	if [[ $ubumirror == "$defmirror" ]]; then
		# Only using one mirror so nothing to add as fallback, not running in AWS maybe?
		return
	fi

	if grep -q "^URIs:.*$defmirror.*$ubumirror" /etc/apt/sources.list.d/ubuntu.sources; then
		echo "Ubuntu upstream is already a fallback, this is unexpected and needs source changes" >&2
		exit 1
	fi
	sed -i "s|$defmirror|& $ubumirror|" /etc/apt/sources.list.d/ubuntu.sources
}

function update_and_upgrade_apt {
	apt-get update --yes
	apt-get dist-upgrade --yes
}

function waitfor_boot_finished {
	while [[ ! -f /var/lib/cloud/instance/boot-finished ]]; do
		echo 'Waiting for cloud-init...'
		sleep 1
	done
}

function install_packages {
	packages=(
		ansible
		debootstrap
		e2fsprogs
		gdisk
		nvme-cli
	)
	apt-get install --yes "${packages[@]}"
	ansible-galaxy collection install community.general
}

# Partition the new root EBS volume
function create_partition_table {
	if [[ $ARCH == arm64 ]]; then
		parted --script /dev/xvdf \
			mklabel gpt \
			mkpart UEFI 1MiB 100MiB \
			mkpart ROOT 100MiB 100%
		set 1 esp on \
			set 1 boot on
		parted --script /dev/xvdf print
	else
		sgdisk -Zg -n1:0:4095 -t1:EF02 -c1:GRUB -n2:0:0 -t2:8300 -c2:EXT4 /dev/xvdf
	fi

	sleep 2
}

function device_partition_mappings {
	# NVMe EBS launch device mappings (symlinks): /dev/nvme*n* to /dev/xvd*
	declare -A blkdev_mappings
	while read -r blkdev; do
		# Mapping info from disk headers
		header=$(nvme id-ctrl --raw-binary "$blkdev" | cut -c3073-3104 | tr -s ' ' | sed 's/ $//g' | sed 's!/dev/!!')
		mapping=/dev/${header%%[0-9]} # normalize sda1 => sda

		# Create /dev/xvd* device symlink
		if [[ -n $mapping ]] && [[ -b $blkdev ]] && [[ ! -L $mapping ]]; then
			ln -s "$blkdev" "$mapping"

			blkdev_mappings[$blkdev]=$mapping
		fi
	done < <(nvme list | awk '/^\/dev/ { print $1 }')

	create_partition_table

	# NVMe EBS launch device partition mappings (symlinks): /dev/nvme*n*p* to /dev/xvd*[0-9]+
	declare -A partdev_mappings
	for blkdev in "${!blkdev_mappings[@]}"; do # /dev/nvme*n*
		mapping=${blkdev_mappings[$blkdev]}

		# Create /dev/xvd*[0-9]+ partition device symlink
		for partdev in "$blkdev"p*; do
			partnum=${partdev##*p}
			if [[ ! -L "$mapping$partnum" ]]; then
				ln -s "${blkdev}p$partnum" "$mapping$partnum"
				partdev_mappings[${blkdev}p$partnum]=$mapping$partnum
			fi
		done
	done
}

# Download and install latest e2fsprogs for fast_commit feature,if required.
function format_and_mount_rootfs {
	mkfs.ext4 -m0.1 /dev/xvdf2

	mount -o noatime,nodiratime /dev/xvdf2 /mnt
	if [[ $ARCH == arm64 ]]; then
		mkfs.fat -F32 /dev/xvdf1
		mkdir -p /mnt/boot/efi
		sleep 2
		mount /dev/xvdf1 /mnt/boot/efi
	fi

	mkfs.ext4 /dev/xvdh

	# Explicitly reserving 100MiB worth of blocks for the data volume
	#
	# Any changes here should be propagated to $GIT_DATA_DIR/ansible/files/admin_api_scripts/grow_fs.sh
	tune2fs -r $((100 * 1024 * 1024 / 4096)) /dev/xvdh

	mkdir -p /mnt/data
	mount -o defaults,discard /dev/xvdh /mnt/data
}

function format_build_partition {
	mkfs.ext4 -O ^has_journal /dev/xvdc
}
# Create fstab
function create_fstab {
	local FMT="%-42s %-11s %-5s %-17s %-5s %s" ROOT_LINE DATA_LINE
	ROOT_LINE=$(findmnt -no SOURCE /mnt | xargs blkid -o export | awk -v FMT="$FMT" '/^UUID=/ { printf(FMT, $0, "/", "ext4", "defaults,discard", "0", "1" ) }')
	DATA_LINE=$(findmnt -no SOURCE /mnt/data | xargs blkid -o export | awk -v FMT="$FMT" '/^UUID=/ { printf(FMT, $0, "/data", "ext4", "defaults,discard", "0", "2" ) }')

	local EFI_LINE=""
	if [[ $ARCH == arm64 ]]; then
		EFI_LINE=$(findmnt -no SOURCE /mnt/boot/efi | xargs blkid -o export | awk -v FMT="$FMT" '/^UUID=/ { printf(FMT, $0, "/boot/efi", "vfat", "umask=0077", "0", "1" ) }')
	fi

	{
		# shellcheck disable=SC2059
		printf "$FMT\n" "# DEVICE UUID" "MOUNTPOINT" "TYPE" "OPTIONS" "DUMP" "FSCK"
		echo "$ROOT_LINE"
		[ -n "$EFI_LINE" ] && echo "$EFI_LINE"
		echo "$DATA_LINE"
	} >/mnt/etc/fstab
}

function setup_chroot_environment {
	# sometimes debootstrap will get stuck on a download for a long time
	# the default read timeout in wget is 900s, which can cause a ~15min increase in build time
	# this forces the process to fail-fast and retry
	cat >~/.wgetrc <<-EOF
		read_timeout = 30
		timeout = 35
		tries = 5
	EOF

	# Use the preferred mirror (if multiple), which is the first URI/preferred
	local mirror
	mirror=$(grep -B1 "$CODENAME-updates" /etc/apt/sources.list.d/ubuntu.sources | awk '/URIs/ {print $2}')
	debootstrap --arch "$ARCH" --variant=minbase "$CODENAME" /mnt "$mirror"

	# Copy our files in since they are updated with all the mirrors!
	cp -a /etc/apt/sources.list /mnt/etc/apt/sources.list
	cp -a /etc/apt/sources.list.d/ubuntu.sources /mnt/etc/apt/sources.list.d/ubuntu.sources

	create_fstab

	# Create mount points and mount the filesystem
	mkdir -p /mnt/{dev,proc,sys}
	mount --rbind /dev /mnt/dev
	mount --rbind /proc /mnt/proc
	mount --rbind /sys /mnt/sys

	# Create build mount point and mount
	mkdir -p /mnt/tmp
	mount /dev/xvdc /mnt/tmp
	chmod 777 /mnt/tmp

	# Copy apparmor profiles
	chmod 644 /tmp/apparmor_profiles/*
	cp -r /tmp/apparmor_profiles /mnt/tmp/

	# Copy migrations
	cp -r /tmp/migrations /mnt/tmp/

	# Copy the bootstrap script into place and execute inside chroot
	cp /tmp/chroot-bootstrap-nix.sh /mnt/tmp/chroot-bootstrap-nix.sh
	chroot /mnt /tmp/chroot-bootstrap-nix.sh
	rm -f /mnt/tmp/chroot-bootstrap-nix.sh
	echo "$POSTGRES_SUPABASE_VERSION" >/mnt/root/supabase-release

	# Copy the AMI version into the /etc/supabase-release file
	echo "$POSTGRES_SUPABASE_VERSION" >/mnt/etc/supabase-release
	chmod 644 /mnt/etc/supabase-release

	# Copy the nvme identification script into /sbin inside the chroot
	mkdir -p /mnt/sbin
	cp /tmp/ebsnvme-id /mnt/sbin/ebsnvme-id
	chmod +x /mnt/sbin/ebsnvme-id

	# Copy the udev rules for identifying nvme devices into the chroot
	mkdir -p /mnt/etc/udev/rules.d
	cp /tmp/70-ec2-nvme-devices.rules \
		/mnt/etc/udev/rules.d/70-ec2-nvme-devices.rules

	#Copy custom cloud-init
	rm -f /mnt/etc/cloud/cloud.cfg
	cp /tmp/cloud.cfg /mnt/etc/cloud/cloud.cfg

	sleep 2
}

function execute_playbook {
	mkdir -p /etc/ansible
	tee /etc/ansible/ansible.cfg <<-EOF
		[defaults]
		callbacks_enabled = timer, profile_tasks, profile_roles
		pipelining = True
	EOF

	# Run Ansible playbook
	# export ANSIBLE_DEBUG=True
	export ANSIBLE_LOG_PATH=/tmp/ansible.log
	export ANSIBLE_REMOTE_TEMP=/mnt/tmp

	# shellcheck disable=SC2086
	ansible-playbook -c chroot -i '/mnt,' /tmp/ansible-playbook/ansible/playbook.yml \
		--extra-vars '{"stage2":false, "qemu":false} ' \
		--extra-vars "psql_version=psql_$POSTGRES_MAJOR_VERSION" \
		$ARGS
}

function update_systemd_services {
	# Disable vector service and set timer unit.
	cp -v /tmp/vector.timer /mnt/etc/systemd/system/vector.timer
	rm -f /mnt/etc/systemd/system/multi-user.target.wants/vector.service
	ln -s /etc/systemd/system/vector.timer /mnt/etc/systemd/system/multi-user.target.wants/vector.timer

	# Disable services during first boot.
	rm -f /mnt/etc/systemd/system/sysinit.target.wants/apparmor.service
	rm -f /mnt/etc/systemd/system/multi-user.target.wants/postgresql.service
	rm -f /mnt/etc/systemd/system/multi-user.target.wants/salt-minion.service

	# Disable auditd
	rm -f /mnt/etc/systemd/system/multi-user.target.wants/auditd.service
}

function clean_system {
	# Copy cleanup scripts
	cp -v /tmp/cleanup.sh /mnt/tmp
	chmod +x /mnt/tmp/cleanup.sh
	chroot /mnt /tmp/cleanup.sh

	# Cleanup logs
	rm -rf /mnt/var/log/*
	# https://github.com/fail2ban/fail2ban/issues/1593
	touch /mnt/var/log/auth.log

	touch /mnt/var/log/pgbouncer.log
	if [[ -f /usr/bin/chown ]]; then
		chroot /mnt /usr/bin/chown pgbouncer:postgres /var/log/pgbouncer.log
	fi

	# Setup postgresql logs
	mkdir -p /mnt/var/log/postgresql
	if [[ -f /usr/bin/chown ]]; then
		chroot /mnt /usr/bin/chown postgres:postgres /var/log/postgresql
	fi

	# Setup wal-g logs
	mkdir /mnt/var/log/wal-g
	touch /mnt/var/log/wal-g/{backup-push.log,backup-fetch.log,wal-push.log,wal-fetch.log,pitr.log}

	#Creatre Sysstat directory for SAR
	mkdir /mnt/var/log/sysstat

	if [[ -f /usr/bin/chown ]]; then
		chroot /mnt /usr/bin/chown -R postgres:postgres /var/log/wal-g
		chroot /mnt /usr/bin/chmod -R 0300 /var/log/wal-g
	fi

	# audit logs directory for apparmor
	mkdir /mnt/var/log/audit

	# unwanted files
	rm -rf /mnt/var/lib/apt/lists/*
	rm -rf /mnt/root/.cache
	rm -rf /mnt/root/.vpython*
	rm -rf /mnt/root/go
	rm -rf /mnt/usr/share/doc
}

function report_packages {
	# shellcheck disable=SC2016
	chroot /mnt dpkg-query -W -f='${Package}\t${Version}\t${Architecture}\n' | LC_COLLATE=C.UTF-8 sort
}

# Unmount bind mounts
function umount_reset_mappings {
	umount -l /mnt/dev
	umount -l /mnt/proc
	umount -l /mnt/sys
	umount -l /mnt/tmp
	if [[ $ARCH == arm64 ]]; then
		umount /mnt/boot/efi
	fi
	umount /mnt/data
	umount /mnt

	# Reset device mappings
	for dev_link in "${blkdev_mappings[@]}" "${partdev_mappings[@]}"; do
		if [[ -L $dev_link ]]; then
			rm -f "$dev_link"
		fi
	done
}

ARCH=$(dpkg --print-architecture)
: "${ARCH:?Failed to detect architecture}"
# shellcheck source=/dev/null
CODENAME=$(source /etc/os-release && echo "$VERSION_CODENAME")
: "${CODENAME:?Failed to detect OS codename}"

waitfor_boot_finished
setup_apt
update_and_upgrade_apt
install_packages
device_partition_mappings
format_and_mount_rootfs
format_build_partition
setup_chroot_environment
execute_playbook
update_systemd_services
clean_system
report_packages
umount_reset_mappings
