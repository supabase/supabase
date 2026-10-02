begin;
do $_$
begin
  if current_setting('server_version_num')::integer >= 150000 and current_setting('server_version_num')::integer < 160000 then
    create extension if not exists plv8 with schema "pg_catalog";
  end if;
end
$_$;
rollback;
