import { safeSql } from '../pg-format'

/**
 * User-defined types introspection. TYPES_SQL (legacy, FROZEN below) left-joins
 * two catalog-wide GROUP BY aggregates (slow on a large catalog). SCOPED_TYPES_SQL
 * (opt-in) returns identical rows but computes enums/attrs per surviving row via
 * correlated index-scan subqueries after the schema/array filters. Both end at
 * the same trailing WHERE so pg-meta-types.ts#list appends the same filter/limit
 * fragments (and, scoped-only, ORDER BY t.oid) to either. Equivalence is proven
 * by execution tests in test/types.test.ts, not a byte snapshot.
 */
export const TYPES_SQL = /* SQL */ safeSql`
-- FROZEN legacy path: served while the pgMetaScopedIntrospection flag is off.
-- Do not edit -- it must keep matching production behavior until the flag
-- cleanup deletes it. SCOPED_TYPES_SQL is the replacement.
select
  t.oid::int8 as id,
  t.typname as name,
  n.nspname as schema,
  format_type (t.oid, null) as format,
  coalesce(t_enums.enums, '[]') as enums,
  coalesce(t_attributes.attributes, '[]') as attributes,
  obj_description (t.oid, 'pg_type') as comment
from
  pg_type t
  left join pg_namespace n on n.oid = t.typnamespace
  left join (
    select
      enumtypid,
      jsonb_agg(enumlabel order by enumsortorder) as enums
    from
      pg_enum
    group by
      enumtypid
  ) as t_enums on t_enums.enumtypid = t.oid
  left join (
    select
      oid,
      jsonb_agg(
        jsonb_build_object('name', a.attname, 'type_id', a.atttypid::int8)
        order by a.attnum asc
      ) as attributes
    from
      pg_class c
      join pg_attribute a on a.attrelid = c.oid
    where
      c.relkind = 'c' and not a.attisdropped
    group by
      c.oid
  ) as t_attributes on t_attributes.oid = t.typrelid
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

export const SCOPED_TYPES_SQL = /* SQL */ safeSql`
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
