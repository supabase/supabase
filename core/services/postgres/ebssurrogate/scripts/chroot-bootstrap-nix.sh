#!/usr/bin/env bash
#
# This script runs inside chrooted environment. It installs grub and its
# Configuration file.
#

set -o errexit
set -o pipefail
set -o xtrace

function setup_apt {
	export DEBIAN_FRONTEND=noninteractive
}

function cleanup_apt {
	apt-get clean
	apt-get autoremove --purge --yes
}

function update_and_upgrade_apt {
	apt-get update --yes
	apt-get dist-upgrade --yes
}

function install_initial_packages {
	local packages=(
		e2fsprogs
		initramfs-tools
	)
	# Install various packages needed for a booting system (with mirror fallback)
	if [[ $ARCH == amd64 ]]; then
		# Do not configure grub during package install
		echo 'grub-pc grub-pc/install_devices_empty select true' | debconf-set-selections
		echo 'grub-pc grub-pc/install_devices select' | debconf-set-selections
		packages+=(
			linux-aws
			grub-pc
		)
	else
		packages+=(
			dosfstools
		)
	fi

	packages+=(
		acpid
		apparmor
		apparmor-utils
		auditd
		bzip2
		cloud-init
		ec2-hibinit-agent
		ec2-instance-connect
		hibagent
		ncurses-term
		ssh-import-id
		sudo
		wget
	)
	if ! apt-get install --yes "${packages[@]}"; then
		echo "FATAL: Failed to install standard packages"
		exit 1
	fi

	packages=(
		at
		cron
		fail2ban
		git
		less
		locales
		logrotate
		openssh-server
		python3-systemd
		ufw
	)
	if [[ $ARCH == arm64 ]]; then
		packages+=(
			cloud-guest-utils
			fdisk
			grub-efi-arm64
			efibootmgr
			# linux-aws is installed separately between amd64 and arm64 because of --no-install-recommends is needed for arm64
			# otherwise we bring in grub-efi-arm64-signed which fails to boot
			linux-aws
		)
	fi

	if ! apt-get install --yes --no-install-recommends "${packages[@]}"; then
		echo "FATAL: Failed to install extra packages"
		exit 1
	fi
}

function setup_locale {
	cat >>/etc/locale.gen <<-EOF
		en_US.UTF-8 UTF-8
	EOF
	cat >/etc/default/locale <<-EOF
		LANG="C.UTF-8"
		LC_CTYPE="C.UTF-8"
	EOF
	locale-gen en_US.UTF-8
}

function setup_postgesql_env {
	# Create the directory if it doesn't exist
	mkdir -p /etc/environment.d

	# Define the contents of the PostgreSQL environment file
	tee /etc/environment.d/postgresql.env >/dev/null <<-EOF
		LOCALE_ARCHIVE=/usr/lib/locale/locale-archive
		LANG="en_US.UTF-8"
		LANGUAGE="en_US.UTF-8"
		LC_ALL="en_US.UTF-8"
		LC_CTYPE="en_US.UTF-8"
	EOF
}

function setup_apparmor {
	# Copy apparmor profiles
	cp -rv /tmp/apparmor_profiles/* /etc/apparmor.d/
}

function setup_grub {
	# Note: Unknown kernel parameters (like zswap settings on kernels without zswap support)
	# are safely ignored by the kernel and passed to user-space. This allows us to
	# include them here without risking boot failures on older or incompatible kernels.
	cat >/etc/default/grub <<-EOF
		GRUB_DEFAULT=0
		GRUB_TIMEOUT=0
		GRUB_TIMEOUT_STYLE="hidden"
		GRUB_DISTRIBUTOR="Supabase postgresql"
		GRUB_CMDLINE_LINUX_DEFAULT="nomodeset console=tty1 console=ttyS0 ipv6.disable=0 transparent_hugepage=never zswap.enabled=1 zswap.zpool=zsmalloc zswap.compressor=zstd zswap.max_pool_percent=10"
	EOF

	if [[ $ARCH == arm64 ]]; then
		rm -rf /etc/grub.d/30_os-prober
		sleep 1
	fi
	grub-install /dev/xvdf && update-grub
}

# skip fsck for first boot
function disable_fsck {
	touch /fastboot
}

# Don't request hostname during boot but set hostname
function setup_hostname {
	# Set the static hostname
	echo "ubuntu" >/etc/hostname
	chmod 644 /etc/hostname

	# Update netplan configuration to not send hostname
	cat >/etc/netplan/01-hostname.yaml <<-EOF
		network:
		  version: 2
		  ethernets:
		    eth0:
		      dhcp4: true
		      dhcp4-overrides:
		        send-hostname: false
	EOF
	# Set proper permissions for netplan security
	chmod 600 /etc/netplan/01-hostname.yaml
}

# Set options for the default interface
function setup_eth0_interface {
	cat >/etc/netplan/eth0.yaml <<-EOF
		network:
		  version: 2
		  ethernets:
		    eth0:
		      dhcp4: true
	EOF
	# Set proper permissions for netplan security
	chmod 600 /etc/netplan/eth0.yaml
}

function disable_sshd_passwd_auth {
	sed -i -E \
		-e 's/^#?\s*PasswordAuthentication\s+(yes|no)\s*$/PasswordAuthentication no/g' \
		-e 's/^#?\s*ChallengeResponseAuthentication\s+(yes|no)\s*$/ChallengeResponseAuthentication no/g' \
		/etc/ssh/sshd_config
}

function create_admin_account {
	groupadd admin
}

function set_default_target {
	rm -f /etc/systemd/system/default.target
	ln -s /lib/systemd/system/multi-user.target /etc/systemd/system/default.target
}

# Prevent services from starting during package installation in chroot
# This avoids hangs from cloud-init, dbus, etc. trying to start services
function disable_services {
	cat >/usr/sbin/policy-rc.d <<-EOF
		#!/bin/sh
		exit 101
	EOF
	chmod +x /usr/sbin/policy-rc.d
}

# Remove policy-rc.d so services start normally on boot
function enable_services {
	rm -f /usr/sbin/policy-rc.d
}

ARCH=$(dpkg --print-architecture)
: "${ARCH:?Failed to detect architecture}"

disable_services
setup_apt
update_and_upgrade_apt
install_initial_packages
setup_locale
setup_postgesql_env
setup_grub
setup_apparmor
setup_hostname
create_admin_account
set_default_target
setup_eth0_interface
disable_sshd_passwd_auth
disable_fsck
cleanup_apt
enable_services
