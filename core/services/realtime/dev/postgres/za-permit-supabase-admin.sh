#!/bin/bash
# Allow peer auth as supabase_admin so the next init .sql can `\connect -` to it without a password
set -euo pipefail

echo "supabase_map postgres supabase_admin" >> "${PGDATA}/pg_ident.conf"
printf 'local all supabase_admin peer map=supabase_map\n%s' "$(cat "${PGDATA}/pg_hba.conf")" > "${PGDATA}/pg_hba.conf.new"
mv "${PGDATA}/pg_hba.conf.new" "${PGDATA}/pg_hba.conf"
pg_ctl reload -D "${PGDATA}" >/dev/null
