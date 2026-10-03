/*

The purpose of this test is to monitor the SQL interface exposed
by Postgres extensions so we have to manually review/approve any difference
that emerge as versions change.

*/


/*

List all extensions that are not enabled
If a new entry shows up in this list, that means a new extension has been
added and you should `create extension ...` to enable it in ./nix/tests/prime

*/

select
  name
from 
  pg_available_extensions
where
  installed_version is null
order by
  name asc;


/*

Monitor relocatability and config of each extension
- lesson learned from pg_cron

*/

select
  extname as extension_name,
  extrelocatable as is_relocatable
from
  pg_extension
order by
  extname asc;


/*

Monitor extension public function interface

*/

select
  e.extname as extension_name,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as argument_types,
  pg_catalog.pg_get_function_result(p.oid) as return_type
from
  pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n
    on n.oid = p.pronamespace
  join pg_catalog.pg_depend d
    on d.objid = p.oid
  join pg_catalog.pg_extension e
    on e.oid = d.refobjid
where
  d.deptype = 'e'
  -- Filter out changes between pg15 and pg16 from extensions that ship with postgres
  -- new in pg16
  and not (e.extname = 'fuzzystrmatch' and p.proname = 'daitch_mokotoff')
  and not (e.extname = 'pageinspect' and p.proname = 'bt_multi_page_stats')
  and not (e.extname = 'pg_buffercache' and p.proname = 'pg_buffercache_summary')
  and not (e.extname = 'pg_buffercache' and p.proname = 'pg_buffercache_usage_counts')
  and not (e.extname = 'pg_walinspect' and p.proname = 'pg_get_wal_block_info')
  -- removed in pg16
  and not (e.extname = 'pg_walinspect' and p.proname = 'pg_get_wal_records_info_till_end_of_wal')
  and not (e.extname = 'pg_walinspect' and p.proname = 'pg_get_wal_stats_till_end_of_wal')
  -- changed in pg16 - output signature added a column
  and not (e.extname = 'pageinspect' and p.proname = 'brin_page_items')
order by
  e.extname,
  n.nspname,
  p.proname,
  md5(pg_catalog.pg_get_function_identity_arguments(p.oid));

/*

Monitor extension public table/view/matview/index interface

*/

select
  e.extname as extension_name,
  n.nspname as schema_name,
  pc.relname as entity_name,
  pa.attname
from
  pg_catalog.pg_class pc
  join pg_catalog.pg_namespace n
    on n.oid = pc.relnamespace
  join pg_catalog.pg_depend d
    on d.objid = pc.oid
  join pg_catalog.pg_extension e
    on e.oid = d.refobjid
  left join pg_catalog.pg_attribute pa
    on pa.attrelid = pc.oid
    and pa.attnum > 0
    and not pa.attisdropped
where
  d.deptype = 'e'
  and pc.relkind in ('r', 'v', 'm', 'i')
order by
  e.extname,
  n.nspname,
  pc.relname,
  pa.attname;
