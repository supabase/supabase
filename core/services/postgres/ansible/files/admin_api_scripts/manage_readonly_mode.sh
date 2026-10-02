#! /usr/bin/env bash

set -euo pipefail

SUBCOMMAND=$1

function set_mode {
	MODE=$1
	psql -h localhost -U supabase_admin -d postgres -c "ALTER SYSTEM SET default_transaction_read_only to ${MODE};"
	psql -h localhost -U supabase_admin -d postgres -c "SELECT pg_reload_conf();"
}

function check_override {
	COMMAND=$(
		cat <<EOF
WITH role_comment as (
    SELECT pg_catalog.shobj_description(r.oid, 'pg_authid') AS content
    FROM pg_catalog.pg_roles r
    WHERE r.rolname = 'postgres'
)
SELECT
    CASE
           WHEN role_comment.content LIKE 'readonly mode overridden until%' THEN
                   (NOW() < to_timestamp(role_comment.content, '"readonly mode overridden until "YYYY-MM-DD\THH24:MI:SS'))::int
           ELSE 0
           END as override_active
FROM role_comment;
EOF
	)
	RESULT=$(psql -h localhost -U supabase_admin -d postgres -At -c "$COMMAND")
	echo -n "$RESULT"
}

case $SUBCOMMAND in
"check_override")
	check_override
	;;
"set")
	shift
	set_mode "$@"
	;;
*)
	echo "Error: '$SUBCOMMAND' is not a known subcommand."
	exit 1
	;;
esac
