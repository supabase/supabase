#!/bin/bash

set -euo pipefail

KEY_FILE="${PGSODIUM_KEY_FILE:-$HOME/.supabase/pgsodium_root.key}"
KEY_DIR="$(dirname "$KEY_FILE")"

# Create directory if it doesn't exist
mkdir -p "$KEY_DIR"

if [[ ! -f ${KEY_FILE} ]]; then
	head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n' >"${KEY_FILE}"
fi
cat "$KEY_FILE"
