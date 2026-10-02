-- Grant postgres EXECUTE on amcheck functions in pg_catalog.
do $$
declare
  saved_search_path text := (select current_setting('search_path'));
  r record;
begin
  perform set_config('search_path', '', true);

  for r in
    select p.oid::regprocedure as sig
      from pg_depend d
      join pg_proc p on p.oid = d.objid and d.classid = 'pg_proc'::regclass
      join pg_extension e on e.oid = d.refobjid
     where e.extname = 'amcheck' and d.deptype = 'e'
  loop
    execute format('grant execute on routine %s to postgres', r.sig);
  end loop;

  perform set_config('search_path', saved_search_path, true);
end $$;
