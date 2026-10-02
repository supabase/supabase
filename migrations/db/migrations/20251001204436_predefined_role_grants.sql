-- migrate:up
grant pg_monitor to supabase_etl_admin, supabase_read_only_user;

do $$
declare
  major_version int;
begin
  select current_setting('server_version_num')::int / 10000 into major_version;

  if major_version >= 16 then
    grant pg_create_subscription to postgres with admin option;
  end if;
end $$;

-- migrate:down
