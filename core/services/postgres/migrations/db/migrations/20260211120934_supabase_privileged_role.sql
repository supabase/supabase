-- migrate:up
do $$
begin
  if not exists (select from pg_roles where rolname = 'supabase_privileged_role') then
    create role supabase_privileged_role;
    grant supabase_privileged_role to postgres, supabase_etl_admin;
  end if;
end $$;

-- migrate:down
