#!/bin/bash

set -euo pipefail

KEY_FILE=/etc/postgresql-custom/pgsodium_root.key

# if key file doesn't exist (project previously didn't use pgsodium), generate a new key
if [[ ! -f ${KEY_FILE} ]]; then
	head -c 32 /dev/urandom | od -A n -t x1 | tr -d ' \n' >$KEY_FILE
fi

cat $KEY_FILE
