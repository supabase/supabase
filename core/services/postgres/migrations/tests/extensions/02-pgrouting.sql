begin;
do $_$
begin
  if not exists (select 1 from pg_extension where extname = 'orioledb') then
    create extension if not exists pgrouting with schema "extensions" cascade;
  end if;
end
$_$;
rollback;
