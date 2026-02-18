#!/bin/sh
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
Up*) ;;
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
[Yy]) ;;
*)
    echo "Cancelled. Not reassigning ownership."
    exit 0
    ;;
esac

docker compose exec -T "$db_srv_name" psql -v ON_ERROR_STOP=1 -U supabase_admin -d postgres <<'EOF'
-- Check what's owned by supabase_admin in public schema
SELECT c.relname, c.relkind, c.relowner::regrole
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
AND c.relowner = 'supabase_admin'::regrole;

-- Reassign user objects in public schema from supabase_admin to postgres
-- (Only affects public schema; Supabase managed schemas stay as-is)
DO $$
DECLARE
  rec record;
BEGIN
  -- Tables, views, sequences, materialized views in public schema
  FOR rec IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    WHERE c.relnamespace = 'public'::regnamespace
    AND c.relowner = 'supabase_admin'::regrole
    AND c.relkind IN ('r', 'v', 'S', 'm', 'p')
    ORDER BY c.relkind DESC
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres', rec.relname);
  END LOOP;

  -- Functions in public schema
  FOR rec IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
    AND p.proowner = 'supabase_admin'::regrole
  LOOP
    EXECUTE format('ALTER ROUTINE public.%I(%s) OWNER TO postgres', rec.proname, rec.args);
  END LOOP;

  -- Types in public schema
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
  LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO postgres', rec.typname);
  END LOOP;
END
$$;
EOF
