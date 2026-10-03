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
	ansible
	autoconf
	automake
	autotools-dev
	cmake-data
	cpp-10
	cpp-9
	gcc-10
	gcc-9
	git
	git-man
	libcgal-dev
	libgcc-9-dev
	libicu-dev
)

apt-get --yes remove --purge "${packages[@]}"
apt-get --yes autoremove
apt-get --yes autoclean
apt-get --yes update
apt-get --yes upgrade

rm -rf /tmp/* /var/tmp/*
history -c
cat /dev/null >/root/.bash_history
unset HISTFILE
find /var/log -mtime -1 -type f -exec truncate -s 0 {} \;
rm -rf /var/log/*.gz /var/log/*.[0-9] /var/log/*-????????
rm -rf /var/lib/cloud/instances/*
rm -f /root/.ssh/authorized_keys /etc/ssh/*key*
touch /etc/ssh/revoked_keys
chmod 600 /etc/ssh/revoked_keys

# Securely erase the unused portion of the filesystem
cat <<-EOF
	Writing zeros to the remaining disk space to securely erase the unused portion of the file system.
	Depending on your disk size this may take several minutes.
	The secure erase will complete successfully when you see:
	    dd: writing to '/zerofile': No space left on device
	Beginning secure erase now
EOF

dd if=/dev/zero of=/zerofile &
PID=$!
while [ -d /proc/$PID ]; do
	printf "."
	sleep 5
done
sync
rm /zerofile
sync
cat /dev/null >/var/log/lastlog
cat /dev/null >/var/log/wtmp
