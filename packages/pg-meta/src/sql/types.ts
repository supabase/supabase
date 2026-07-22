import { safeSql } from '../pg-format'

/**
 * Introspection SQL for user-defined types (enums, composites, ...).
 *
 * Two complete, standalone templates are kept so each rendered statement is
 * easy to read and diff:
 *
 * - `TYPES_SQL` (legacy, default): left-joins two subqueries that are GROUP-BY
 *   aggregated over the ENTIRE catalog -- `t_enums` over all of pg_enum and
 *   `t_attributes` over the attributes of ALL composite relations. The wrapper's
 *   schema/array filters are applied OUTSIDE, so the planner materializes both
 *   aggregates over the full catalog and discards almost everything (5.7-9.6s on
 *   a ~465K-row catalog).
 * - `SCOPED_TYPES_SQL` (opt-in via `scoped: true`): identical output, but enums
 *   and attributes are computed per-surviving-row via correlated scalar
 *   subqueries (index scans on pg_enum's (enumtypid, enumsortorder) unique index
 *   and pg_attribute's (attrelid, attnum) index) AFTER the row has passed the
 *   schema/typrelid/array filters. Both templates end at the same trailing WHERE
 *   `)` so `pg-meta-types.ts#list` can append the same filter/limit fragments to
 *   either base.
 *
 * `scoped` defaults to false so Studio can roll the optimization out behind a
 * feature flag. `TYPES_SQL` is the FROZEN legacy path (see the comment on it);
 * behavioral equivalence between the two is enforced by execution-based tests in
 * test/types.test.ts, not by a byte-for-byte SQL snapshot.
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
