#!/usr/bin/env bash
# pgdata-chown — transfers PGDATA ownership for pgBackRest restore operations.
#
# Called via sudo by supabase-admin-agent (running as adminapi).  Only two
# actions are accepted, and the target path must resolve to /data/pgdata or a
# path beneath it.  realpath(1) is used to expand symlinks before the check,
# which prevents directory-traversal attacks (e.g. /data/pgdata/../../etc/sudoers).
#
# Usage: pgdata-chown <to-pgbackrest|to-postgres> <path>
set -euo pipefail

if [[ $# -ne 2 ]]; then
	echo "usage: pgdata-chown <to-pgbackrest|to-postgres> <path>" >&2
	exit 1
fi

ACTION="$1"
TARGET="$2"

REAL=$(realpath "$TARGET")
if [[ $REAL != "/data/pgdata" && $REAL != /data/pgdata/* ]]; then
	echo "error: '${TARGET}' resolves to '${REAL}', which is not under /data/pgdata" >&2
	exit 1
fi

case "$ACTION" in
to-pgbackrest | to-postgres)
	exec /usr/bin/chown -R "${ACTION:3}:postgres" "$REAL"
	;;
*)
	echo "error: unknown action '${ACTION}'; expected to-pgbackrest or to-postgres" >&2
	exit 1
	;;
esac
