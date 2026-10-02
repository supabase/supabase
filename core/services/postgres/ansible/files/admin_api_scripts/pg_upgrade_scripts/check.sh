#! /usr/bin/env bash
## This script provides a method to check the status of the database upgrade
## process, which is updated in /tmp/pg-upgrade-status by initiate.sh
## This runs on the old (source) instance.

set -euo pipefail

STATUS_FILE="/tmp/pg-upgrade-status"

if [ -f "${STATUS_FILE}" ]; then
	STATUS=$(cat "${STATUS_FILE}")
	echo -n "${STATUS}"
else
	echo -n "unknown"
fi
