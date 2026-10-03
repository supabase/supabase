#!/usr/bin/env bash

set -euo pipefail

KEY_FILE=${1:-/tmp/pgsodium.key}
if [[ ! -f $KEY_FILE ]]; then
	head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n' >"$KEY_FILE"
fi
cat "$KEY_FILE"
