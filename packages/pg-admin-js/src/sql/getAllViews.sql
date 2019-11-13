select 
  table_schema, 
  table_name,
  check_option,
  is_updatable,
  is_insertable_into,
  is_trigger_updatable,
  is_trigger_deletable,
  is_trigger_insertable_into
  
from information_schema.views
where table_schema = ?
-- and table_schema not in ('information_schema', 'pg_catalog')
