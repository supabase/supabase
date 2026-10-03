-- migrate:up
do $$
begin
  if exists (select from pg_namespace where nspname = 'storage') then
    grant usage on schema storage to postgres with grant option;
  end if;
end $$;

-- migrate:down
