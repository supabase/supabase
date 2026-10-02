#!/bin/bash

# DigitalOcean Marketplace Image Validation Tool
# © 2021 DigitalOcean LLC.
# This code is licensed under Apache 2.0 license (see LICENSE.md for details)

set -ex

# Ensure /tmp exists and has the proper permissions before
# checking for security updates
# https://github.com/digitalocean/marketplace-partners/issues/94
if [[ ! -d /tmp ]]; then
	mkdir /tmp
fi
chmod 1777 /tmp

# Cleanup more packages
packages=(
	ansible
	ansible-core
	apport
	appstream
	autoconf
	automake
	autotools-dev
	bash-completion
	bcache-tools
	bind9-dnsutils
	bind9-host
	bind9-libs
	bolt
	btrfs-progs
	byobu
	cmake-data
	command-not-found
	console-setup
	cpp-10
	cpp-9
	distro-info
	eject
	'fonts-dejavu*'
	fonts-ubuntu-console
	friendly-recovery
	ftp
	fwupd
	gawk
	gcc-10
	gcc-9
	gdisk
	git
	git-man
	gnupg
	keyboard-configuration
	libc6-dev
	libcgal-dev
	libclang-cpp18
	libevent-dev
	libgcc-9-dev
	libicu-dev
	libicu74
	libpcre3-dev
	libssl-dev
	libsystemd-dev
	libvolume-key1
	'linux-headers*'
	linux-libc-dev
	lvm2
	lxd-agent-loader
	lxd-installer
	man-db
	mdadm
	modemmanager
	mtd-utils
	multipath-tools
	nano
	netcat-openbsd
	nfs-common
	ntfs-3g
	open-vm-tools
	packagekit
	parted
	pastebinit
	plymouth
	publicsuffix
	python-babel-localedata
	python3-botocore
	python3-pygments
	python3-twisted
	screen
	snapd
	strace
	thin-provisioning-tools
	tmux
	unattended-upgrades
	usb-modeswitch
	vim
	vim-runtime
	wget
	whiptail
	xauth
	xfsprogs
)

if [[ $(uname -m) == aarch64 ]]; then
	packages+=(libgcc-8-dev)
fi

apt-mark manual libevent-2.1-7t64
apt-get --yes remove --purge "${packages[@]}"
apt-get --yes autoremove
apt-get --yes autoclean
apt-get --yes update
apt-get --yes upgrade

systemctl set-default multi-user.target
systemctl disable getty@tty1.service
systemctl mask getty@tty1.service
systemctl mask graphical.target

rm -rf /tmp/* /var/tmp/*
history -c
cat /dev/null >/root/.bash_history
unset HISTFILE

journalctl --rotate
journalctl --vacuum-time=1s
find /var/log -mtime -1 -type f -exec truncate -s 0 {} \;
rm -rf /var/log/*.gz /var/log/*.[0-9] /var/log/*-????????
rm -rf /var/lib/cloud/instances/*
rm -f /root/.ssh/authorized_keys /etc/ssh/*key*
touch /etc/ssh/revoked_keys
chmod 600 /etc/ssh/revoked_keys

cat /dev/null >/var/log/lastlog
cat /dev/null >/var/log/wtmp

dd if=/dev/zero of=/zerofile &
PID=$!
while [ -d /proc/$PID ]; do
	printf "."
	sleep 5
done
sync
rm /zerofile
sync

fstrim /
