#!/usr/bin/env bash

set -euo pipefail

if systemctl whoami &>/dev/null || [[ $(uname) == Darwin ]]; then
	# systemd is running so we can install in multi-user mode
	# or running on macos
	daemon=--daemon
	nixconfdir=/etc/nix
	path=/nix/var/nix/profiles/default/bin

	tmpdir=$(mktemp -d)
	trap 'cd; rm -rf $tmpdir' EXIT

	function maybesudo { sudo -EH env "$@"; }
else
	# systemd is *not* running so we must install in single-user mode
	daemon=--no-daemon
	nixconfdir=$HOME/.config/nix
	path=$HOME/.nix-profile/bin

	tmpdir=$nixconfdir

	function maybesudo { env "$@"; }
fi

maybesudo mkdir -p "$nixconfdir"
cat >"$tmpdir/nix.conf" <<-EOF
	always-allow-substitutes = true
	extra-experimental-features = flakes nix-command
	extra-substituters = https://nix-postgres-artifacts.s3.amazonaws.com
	extra-trusted-public-keys = nix-postgres-artifacts:dGZlQOvKcNEjvT7QEAJbcV6b6uk7VF/hWMjhYleiaLI=
	max-jobs = 5
EOF

if [[ -e /dev/kvm ]]; then
	sudo chown runner /dev/kvm
	sudo chmod 666 /dev/kvm
	echo 'extra-system-features = kvm' >>"$tmpdir/nix.conf"
fi

if [[ ${PUSH_TO_CACHE:?} == true ]]; then
	set -x
	maybesudo NIXCONFDIR="$nixconfdir" NIXBINDIR="$path" ./setup-push.sh >>"$tmpdir/nix.conf"
fi

maybesudo NIXCONFDIR="$nixconfdir" ./setup-github-access.sh >>"$tmpdir/nix.conf"

curl -L https://releases.nixos.org/nix/nix-2.34.6/install | sh -s -- $daemon --yes --nix-extra-conf-file "$tmpdir/nix.conf"
cat "$nixconfdir/nix.conf"

# Add nix to PATH for subsequent steps
echo "$path" >>"${GITHUB_PATH:?}"
