export const MATERIALIZED_VIEWS_SQL = /* SQL */ `
select
  c.oid::int8 as id,
  n.nspname as schema,
  c.relname as name,
  c.relispopulated as is_populated,
  obj_description(c.oid) as comment
from
  pg_class c
  join pg_namespace n on n.oid = c.relnamespace
where
  c.relkind = 'm'
`
