#!/usr/bin/env bash
set -euo pipefail

function verify {
	failures=0
	artifacts=0
	while IFS=$'\t' read -r path url expected; do
		((++artifacts))
		if ! checksum=$(curl --fail --location --silent --show-error "$url" | sha256sum); then
			echo "FAIL $path: download failed" >&2
			((++failures))
			continue
		fi

		actual=${checksum%% *}
		if [[ $expected == sha256:$actual ]]; then
			echo "OK   $path" >&2
		else
			printf "FAIL %s:\n       expected %s\n       got      %s\n" "$path" "$expected" "sha256:$actual" >&2
			((++failures))
		fi
	done < <(
		jinja2 --format=yaml "$vars" "$vars" |
			yq -r '.. | select(tag == "!!map" and has("url") and has("checksum")) | [(path | join(".")), .url, .checksum] | @tsv' |
			sort
	)

	if ((artifacts == 0)); then
		echo "error: no artifacts found" >&2
		exit 1
	fi
	if ((failures > 0)); then
		echo "$failures of $artifacts artifacts failed verification" >&2
		exit 1
	fi
	exit 0
}

function update {
	local tool=$1
	local version=$2
	local release=${tool}_release
	local artifacts=${tool}_artifacts

	if ! yq 'keys[]' "$vars" | grep -x "$release" >/dev/null; then
		echo "error: uknown tool $tool, missing $release" >&2
		exit 1
	fi

	if ! yq 'keys[]' "$vars" | grep -x "$artifacts" >/dev/null; then
		echo "error: uknown tool $tool, missing $artifacts" >&2
		exit 1
	fi

	workdir=$(mktemp -d "$root-ansible-vars-update-XXXXXX")
	trap 'rm -rf "$workdir"' EXIT
	cd "$workdir"

	VERSION=$version yq ".$release = strenv(VERSION)" "$vars" >vars.yml
	jinja2 --format=yaml vars.yml vars.yml >rendered.yml

	local url
	declare -A paths=()
	if yq -re ".$artifacts | has(\"url\")" rendered.yml &>/dev/null; then
		url=$(yq -r ".$artifacts.url" rendered.yml)
		if [[ -z $url ]]; then
			echo "error: $artifacts url is empty" >&2 && exit 1
		fi
		paths[$url]=."$artifacts".checksum
	else
		while read -r key; do
			url=$(yq -r ".$artifacts.$key.url" rendered.yml)
			if [[ -z $url ]]; then
				echo "error: $artifacts url is empty" >&2 && exit 1
			fi
			paths[$url]=".$artifacts.$key.checksum"
		done < <(yq -r ".$artifacts | keys | .[]" rendered.yml)
	fi

	local checksum
	declare -A checksums=()
	for url in "${!paths[@]}"; do
		echo "Downloading $url" >&2
		checksum=$(curl --fail --location --silent --show-error "$url" | sha256sum)
		checksums[$url]=sha256:${checksum%% *}
	done

	for url in "${!checksums[@]}"; do
		yq -i "${paths[$url]} = \"${checksums[$url]}\"" vars.yml
	done

	if ! cmp --silent vars.yml "$vars"; then
		mv vars.yml "$vars"
		echo "ansible/vars.yml updated $tool -> $version" >&2
	else
		echo "ansible/vars.yml is already up to date" >&2
	fi
}

root=$(git rev-parse --show-toplevel)
vars=$root/ansible/vars.yml

if (($# == 2)); then
	update "$@"
elif (($# != 1)) || [[ $1 != verify ]]; then
	echo "Usage: $(basename "$0") <tool> <version>" >&2
	echo "Usage: $(basename "$0") verify" >&2
	exit 1
fi

verify
