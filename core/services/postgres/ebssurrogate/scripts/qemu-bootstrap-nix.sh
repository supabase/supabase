#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o xtrace

#################
# stage1 things #
#################

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

function cleanup_apt {
	apt-get clean
	apt-get autoremove --purge --yes
	rm -rf /var/lib/apt/lists/*
}

function update_and_upgrade_apt {
	apt-get update --yes
	apt-get dist-upgrade --yes
}

function waitfor_boot_finished {
	# Wait for cloudinit on the surrogate to complete before making progress
	while [[ ! -f /var/lib/cloud/instance/boot-finished ]]; do
		echo 'Waiting for cloud-init...'
		sleep 1
	done
}

function install_packages {
	packages=(
		ansible
		arptables
		e2fsprogs
		ebtables
		gpg
		iptables
		less
		locales
		logrotate
		nfs-common
		software-properties-common
		ufw
	)
	apt-get install --yes "${packages[@]}"
	ansible-galaxy collection install community.general
}

function execute_playbook {
	sed -i 's/- hosts: all/- hosts: localhost/' ansible/playbook.yml

	mkdir -p /etc/ansible
	tee /etc/ansible/ansible.cfg <<-EOF
		[defaults]
		callbacks_enabled = timer, profile_tasks, profile_roles
	EOF

	# Run Ansible playbook
	export ANSIBLE_LOG_PATH=/tmp/ansible.log && export ANSIBLE_REMOTE_TEMP=/mnt/tmp
	ansible-playbook ./ansible/playbook.yml --extra-vars '{"stage2": false, "qemu": true}' \
		--extra-vars "postgresql_version=postgresql_$POSTGRES_MAJOR_VERSION" \
		--extra-vars "postgresql_major_version=$POSTGRES_MAJOR_VERSION" \
		--extra-vars "postgresql_major=$POSTGRES_MAJOR_VERSION" \
		--extra-vars "psql_version=psql_$POSTGRES_MAJOR_VERSION" \
		--extra-vars @./ansible/qemu-vars.yaml
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

#################
# stage2 things #
#################

function install_nix() {
	curl -L https://releases.nixos.org/nix/nix-2.34.6/install | sh -s -- --yes --daemon --nix-extra-conf-file <(
		cat <<-EOF
			extra-experimental-features = nix-command flakes
			extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
			extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
		EOF
	)

	# shellcheck disable=SC1091
	. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
	nix --version
}

function execute_stage2_playbook {
	mkdir -p /etc/ansible
	tee /etc/ansible/ansible.cfg <<-EOF
		[defaults]
		callbacks_enabled = timer, profile_tasks, profile_roles
	EOF

	# Run Ansible playbook
	export ANSIBLE_LOG_PATH=/tmp/ansible.log && export ANSIBLE_REMOTE_TEMP=/tmp
	ansible-playbook ./ansible/playbook.yml \
		--extra-vars '{"stage2": true, "qemu": true}' \
		--extra-vars "git_commit_sha=$GIT_SHA" \
		--extra-vars "postgresql_version=postgresql_$POSTGRES_MAJOR_VERSION" \
		--extra-vars "postgresql_major_version=$POSTGRES_MAJOR_VERSION" \
		--extra-vars "postgresql_major=$POSTGRES_MAJOR_VERSION" \
		--extra-vars "psql_version=psql_$POSTGRES_MAJOR_VERSION" \
		--extra-vars @./ansible/qemu-vars.yaml
}

function clean_legacy_things {
	# removes things that are bundled for legacy reasons, but we can start without for our newer artifacts
	apt-mark auto zlib1g* # TODO (darora): need to make sure that there aren't other things that still need this
	apt-get purge --yes kong
}

function clean_system {
	# we do not want to ship an initialized DB as this is performed as needed
	mkdir -p /db/template
	mv /data/pgdata /db/template
	cloud-init clean --logs

	# Copy cleanup scripts
	chmod +x /tmp/cleanup-qemu.sh
	/tmp/cleanup-qemu.sh

	# Cleanup logs
	rm -rf /var/log/*
	# https://github.com/fail2ban/fail2ban/issues/1593
	touch /var/log/auth.log

	touch /var/log/pgbouncer.log
	chown pgbouncer:postgres /var/log/pgbouncer.log

	# Setup postgresql logs
	mkdir -p /var/log/postgresql
	chown postgres:postgres /var/log/postgresql
	# Setup wal-g logs
	mkdir /var/log/wal-g
	touch /var/log/wal-g/{backup-push.log,backup-fetch.log,wal-push.log,wal-fetch.log,pitr.log}

	# Creatre Sysstat directory for SAR
	mkdir /var/log/sysstat

	chown -R postgres:postgres /var/log/wal-g
	# moving up fixes from init scripts
	chmod -R 0310 /var/log/wal-g
	chmod 0340 /var/log/wal-g/pitr.log

	# audit logs directory for apparmor
	mkdir /var/log/audit

	# unwanted files
	rm -rf /root/.cache
	rm -rf /root/.vpython*
	rm -rf /root/go
	rm -rf /mnt/usr/share/doc

	# remove passwords in user-data-cloudimg.img (required for Packer login)
	usermod -p '*' ubuntu
	usermod -p '*' root

	# Ensure that PasswordAuthentication is off
	# From chroot-boostrap-nix.sh
	sed -i -E \
		-e 's/^#?\s*PasswordAuthentication\s+(yes|no)\s*$/PasswordAuthentication no/g' \
		-e 's/^#?\s*ChallengeResponseAuthentication\s+(yes|no)\s*$/ChallengeResponseAuthentication no/g' \
		/etc/ssh/sshd_config

	if ! grep -qE "^PasswordAuthentication\s+no" /etc/ssh/sshd_config; then
		echo "ERROR: PasswordAuthentication is not disabled in sshd_config"
		exit 1
	fi
}

function clean_nix {
	nix-collect-garbage -d
	nix-store --optimise -v
}

function report_packages {
	# shellcheck disable=SC2016
	dpkg-query -W -f='${Package}\t${Version}\t${Architecture}\n' | LC_COLLATE=C.UTF-8 sort
	find /nix/store -maxdepth 1 | LC_COLLATE=C.UTF-8 sort -t- -k2
}

function report_disk_usage {
	read -r dub _ < <(du -sx -B1 /)
	read -r duh _ < <(du -sx -h /)
	printf '::notice::disk_usage bytes=%s human=%s\n' "$dub" "$duh" | tee -a /tmp/ansible.log
}

#################
# stage1 things #
#################

ARCH=$(dpkg --print-architecture)
: "${ARCH:?Failed to detect architecture}"
# shellcheck source=/dev/null
CODENAME=$(source /etc/os-release && echo "$VERSION_CODENAME")
: "${CODENAME:?Failed to detect OS codename}"

waitfor_boot_finished
setup_apt
update_and_upgrade_apt
install_packages
setup_postgesql_env
setup_locale
execute_playbook

#################
# stage2 things #
#################

install_nix
execute_stage2_playbook
clean_legacy_things
clean_system
clean_nix
cleanup_apt
report_packages
report_disk_usage
