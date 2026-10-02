#!/usr/bin/env bash
# shellcheck shell=bash

set -o errexit
set -o pipefail
set -o xtrace

exec 1>&2

function setup_apt {
	export DEBIAN_FRONTEND=noninteractive
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

function install_packages {
	apt-get install -y ansible
	ansible-galaxy collection install community.general
}

function install_nix() {
	curl -L https://releases.nixos.org/nix/nix-2.34.6/install | sh -s -- --yes --daemon --nix-extra-conf-file <(
		cat <<-EOF
			extra-experimental-features = nix-command flakes
			extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
			extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
		EOF
	)

	#shellcheck disable=SC1091
	. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
	nix --version
}

function execute_stage2_playbook {
	echo "POSTGRES_MAJOR_VERSION: $POSTGRES_MAJOR_VERSION"
	echo "GIT_SHA: $GIT_SHA"
	mkdir -p /etc/ansible
	tee /etc/ansible/ansible.cfg <<-EOF
		[defaults]
		callbacks_enabled = timer, profile_tasks, profile_roles
	EOF
	sed -i 's/- hosts: all/- hosts: localhost/' /tmp/ansible-playbook/ansible/playbook.yml

	# Run Ansible playbook
	export ANSIBLE_LOG_PATH=/tmp/ansible.log
	export ANSIBLE_REMOTE_TEMP=/tmp

	# shellcheck disable=SC2086
	ansible-playbook /tmp/ansible-playbook/ansible/playbook.yml \
		--extra-vars '{"stage2":true, "qemu":false}' \
		--extra-vars "git_commit_sha=$GIT_SHA" \
		--extra-vars "psql_version=psql_$POSTGRES_MAJOR_VERSION" \
		--extra-vars "postgresql_version=postgresql_$POSTGRES_MAJOR_VERSION" \
		--extra-vars "postgresql_major_version=$POSTGRES_MAJOR_VERSION" \
		$ARGS
}

function cleanup_packages {
	apt-get remove --purge --yes ansible
}

function cleanup_nix {
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

setup_apt
update_and_upgrade_apt
install_packages
install_nix
execute_stage2_playbook
cleanup_packages
cleanup_nix
update_and_upgrade_apt
cleanup_apt
report_packages
report_disk_usage
