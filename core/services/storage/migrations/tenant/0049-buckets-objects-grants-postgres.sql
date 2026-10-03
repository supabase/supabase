do $$
begin
  if exists (select from pg_roles where rolname = 'postgres') then
    grant all on storage.buckets, storage.objects to postgres with grant option;
  end if;
end $$;
