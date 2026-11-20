#!/bin/sh
#
# Reassign ownership of public schema objects from supabase_admin to postgres.
#
# Context and documentation:
#   https://supabase.com/docs/guides/self-hosting/remove-superuser-access
#
# Credits:
#   Original version by Inder Singh.
#
# Usage:
#   sh utils/reassign-owner.sh
#

set -e

if ! docker compose version >/dev/null 2>&1; then
    echo "Docker Compose not found."
    exit 1
fi

# Check Postgres service
db_image_prefix="supabase.postgres:"

compose_output=$(docker compose ps \
    --format '{{.Image}}\t{{.Service}}\t{{.Status}}' 2>/dev/null |
    grep -m1 "^$db_image_prefix" || true)

if [ -z "$compose_output" ]; then
    echo "Postgres container not found. Exiting."
    exit 1
fi

db_srv_name=$(echo "$compose_output" | cut -f2)
db_srv_status=$(echo "$compose_output" | cut -f3)

case "$db_srv_status" in
    Up*)
        ;;
    *)
        echo "Postgres container status: $db_srv_status"
        echo "Exiting."
        exit 1
        ;;
esac

if ! test -t 0; then
    echo ""
    echo "Running non-interactively. Not reassigning ownership."
    exit 0
fi

printf "Reassign public schema objects to postgres user? (y/N) "
read -r REPLY
case "$REPLY" in
    [Yy])
        ;;
    *)
        echo "Canceled. Not reassigning ownership."
        exit 0
        ;;
esac

docker compose exec -T "$db_srv_name" psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<'EOF'
\echo 'Current supabase_admin-owned objects in public schema:'
SELECT c.relname, c.relkind, c.relowner::regrole
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
AND c.relowner = 'supabase_admin'::regrole;

-- Reassign user objects in public schema from supabase_admin to postgres.
-- (Only affects public schema; Supabase-managed schemas stay as-is.
-- Extension-owned objects are skipped.)
DO $$
DECLARE
    rec record;
    rel_count int := 0;
    fn_count int := 0;
    type_count int := 0;
BEGIN
    -- Tables, views, sequences, materialized views, partitioned tables
    FOR rec IN
        SELECT c.relname, c.relkind
        FROM pg_class c
        WHERE c.relnamespace = 'public'::regnamespace
        AND c.relowner = 'supabase_admin'::regrole
        AND c.relkind IN ('r', 'v', 'S', 'm', 'p')
        AND NOT EXISTS (
            SELECT 1 FROM pg_depend d
            WHERE d.classid = 'pg_class'::regclass
            AND d.objid = c.oid
            AND d.deptype = 'e'
        )
        ORDER BY CASE c.relkind
            WHEN 'p' THEN 0  -- partitioned parents first; cascades ownership to partitions
            WHEN 'm' THEN 1
            WHEN 'r' THEN 2
            WHEN 'v' THEN 3
            WHEN 'S' THEN 4
        END
    LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO postgres', rec.relname);
        rel_count := rel_count + 1;
    END LOOP;

    -- Functions and procedures
    FOR rec IN
        SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
        AND p.proowner = 'supabase_admin'::regrole
        AND NOT EXISTS (
            SELECT 1 FROM pg_depend d
            WHERE d.classid = 'pg_proc'::regclass
            AND d.objid = p.oid
            AND d.deptype = 'e'
        )
    LOOP
        EXECUTE format('ALTER ROUTINE public.%I(%s) OWNER TO postgres', rec.proname, rec.args);
        fn_count := fn_count + 1;
    END LOOP;

    -- Types (excluding array types and table-bound composites)
    FOR rec IN
        SELECT t.typname
        FROM pg_type t
        WHERE t.typnamespace = 'public'::regnamespace
        AND t.typowner = 'supabase_admin'::regrole
        AND t.typrelid = 0
        AND NOT EXISTS (
            SELECT 1 FROM pg_type el
            WHERE el.oid = t.typelem
            AND el.typarray = t.oid
        )
        AND NOT EXISTS (
            SELECT 1 FROM pg_depend d
            WHERE d.classid = 'pg_type'::regclass
            AND d.objid = t.oid
            AND d.deptype = 'e'
        )
    LOOP
        EXECUTE format('ALTER TYPE public.%I OWNER TO postgres', rec.typname);
        type_count := type_count + 1;
    END LOOP;

    RAISE NOTICE 'Reassigned % relation(s), % routine(s), % type(s) from supabase_admin to postgres.',
        rel_count, fn_count, type_count;
END
$$;
EOF

echo ""
echo "Done."
