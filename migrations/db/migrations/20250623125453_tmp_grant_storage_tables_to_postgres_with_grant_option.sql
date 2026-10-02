-- migrate:up
-- TODO: remove this migration once STORAGE-211 is completed
-- DRI: bobbie
do $$
begin
  if exists (select from pg_class where relnamespace = (select oid from pg_namespace where nspname = 'storage') and relname = 'buckets') then
    grant all on storage.buckets to postgres with grant option;
  end if;
  if exists (select from pg_class where relnamespace = (select oid from pg_namespace where nspname = 'storage') and relname = 'objects') then
    grant all on storage.objects to postgres with grant option;
  end if;
end $$;

-- migrate:down
