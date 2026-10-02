#!/usr/bin/env bash
# pgdata-signal — creates or removes PostgreSQL signal files and stale pid files.
# Called via sudo (as postgres) by supabase-admin-agent (running as adminapi).
#
# All file paths are hardcoded to prevent path injection.  No external
# path argument is accepted.
#
# Usage: pgdata-signal <create|remove> <recovery|standby>
#        pgdata-signal remove-pid
set -euo pipefail

# Special-case: remove-pid removes the stale postmaster.pid file that would
# prevent PostgreSQL from starting after a restore.  Handled as a single-arg
# command to keep the sudoers entry scoped to this script rather than allowing
# a broad "rm" entry.
if [[ $# -eq 1 && $1 == "remove-pid" ]]; then
	exec /usr/bin/rm -f "/data/pgdata/postmaster.pid"
fi

if [[ $# -ne 2 ]]; then
	echo "usage: pgdata-signal <create|remove> <recovery|standby>" >&2
	echo "       pgdata-signal remove-pid" >&2
	exit 1
fi

ACTION="$1"
SIGNAL_TYPE="$2"

case "$SIGNAL_TYPE" in
recovery | standby) FILE="/data/pgdata/${SIGNAL_TYPE}.signal" ;;
*)
	echo "error: unknown signal type '${SIGNAL_TYPE}'; expected recovery or standby" >&2
	exit 1
	;;
esac

case "$ACTION" in
create) exec /usr/bin/touch "${FILE}" ;;
remove) exec /usr/bin/rm -f "${FILE}" ;;
*)
	echo "error: unknown action '${ACTION}'; expected create or remove" >&2
	exit 1
	;;
esac
