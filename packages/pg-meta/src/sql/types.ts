import { safeSql } from '../pg-format'

/**
 * User-defined types. Enums/attrs are correlated subqueries after schema
 * filters so the planner does not GROUP BY the whole catalog first.
 * Ends at a trailing WHERE so pg-meta-types.ts#list can append filters,
 * `order by t.oid`, and limit.
 */
export const TYPES_SQL = /* SQL */ safeSql`
select
  t.oid::int8 as id,
  t.typname as name,
  n.nspname as schema,
  format_type (t.oid, null) as format,
  coalesce(
    (
      select
        jsonb_agg(e.enumlabel order by e.enumsortorder)
      from
        pg_enum e
      where
        e.enumtypid = t.oid
    ),
    '[]'
  ) as enums,
  coalesce(
    (
      select
        jsonb_agg(
          jsonb_build_object('name', a.attname, 'type_id', a.atttypid::int8)
          order by a.attnum asc
        )
      from
        pg_attribute a
      where
        a.attrelid = t.typrelid and not a.attisdropped
    ),
    '[]'
  ) as attributes,
  obj_description (t.oid, 'pg_type') as comment
from
  pg_type t
  left join pg_namespace n on n.oid = t.typnamespace
where
  (
    t.typrelid = 0
    or (
      select
        c.relkind = 'c'
      from
        pg_class c
      where
        c.oid = t.typrelid
    )
  )
`
