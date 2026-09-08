import { safeSql, type SafeSqlFragment } from '../pg-format'

/**
 * Builder for the tables introspection query.
 *
 * `targetOid`, when provided, is a scalar SQL fragment yielding the single OID
 * to restrict the query to -- either a literal (`123`) or an uncorrelated scalar
 * subquery (`(select tc.oid from pg_class tc join ... where relname=..)`). It is
 * compared with `=` so the planner evaluates it once as an initplan constant and
 * drives INDEX scans on the base pg_class scan AND the primary-key /
 * relationships subqueries, instead of computing sizes, PKs and FK relationships
 * for the ENTIRE catalog. (A multiply-referenced CTE would be materialized and
 * act as an optimization barrier, forcing seq scans -- hence a scalar.) The
 * relationships filter keeps BOTH directions (conrelid OR confrelid), matching
 * the outgoing/incoming FK rows the unscoped query would have matched by name.
 *
 * When `targetOid` is omitted the injected fragments are empty and the rendered
 * SQL is the legacy full-catalog query -- `TABLES_SQL` below is exactly that
 * rendering, so every existing consumer is unaffected. Behavioral equivalence
 * between the scoped and unscoped forms is enforced by execution-based tests in
 * test/tables.test.ts, not by a byte-for-byte SQL snapshot.
 */
export const getTablesSql = (targetOid?: SafeSqlFragment) => {
  const mainScope = targetOid
    ? safeSql`
  AND c.oid = ${targetOid}`
    : safeSql``
  const pkScope = targetOid
    ? safeSql`
      and c.oid = ${targetOid}`
    : safeSql``
  const relScope = targetOid
    ? safeSql`
      and (c.conrelid = ${targetOid} or c.confrelid = ${targetOid})`
    : safeSql``
  // Scoped path only: deterministic relationships order (plan-order dependent
  // otherwise). A composite FK expands to one entry per source×target column
  // pair sharing constraint_name, so tie-break on the column names. Empty for
  // legacy, keeping TABLES_SQL byte-for-byte unchanged.
  const relOrder = targetOid
    ? safeSql` order by relationships.constraint_name, relationships.source_column_name, relationships.target_column_name`
    : safeSql``

  return /* SQL */ safeSql`
SELECT
  c.oid :: int8 AS id,
  nc.nspname AS schema,
  c.relname AS name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  CASE
    WHEN c.relreplident = 'd' THEN 'DEFAULT'
    WHEN c.relreplident = 'i' THEN 'INDEX'
    WHEN c.relreplident = 'f' THEN 'FULL'
    ELSE 'NOTHING'
  END AS replica_identity,
  pg_total_relation_size(format('%I.%I', nc.nspname, c.relname)) :: int8 AS bytes,
  pg_size_pretty(
    pg_total_relation_size(format('%I.%I', nc.nspname, c.relname))
  ) AS size,
  pg_stat_get_live_tuples(c.oid) AS live_rows_estimate,
  pg_stat_get_dead_tuples(c.oid) AS dead_rows_estimate,
  obj_description(c.oid) AS comment,
  coalesce(pk.primary_keys, '[]') as primary_keys,
  coalesce(
    jsonb_agg(relationships${relOrder}) filter (where relationships is not null),
    '[]'
  ) as relationships
FROM
  pg_namespace nc
  JOIN pg_class c ON nc.oid = c.relnamespace
  left join (
    select
      c.oid::int8 as table_id,
      jsonb_agg(
        jsonb_build_object(
          'table_id', c.oid::int8,
          'schema', n.nspname,
          'table_name', c.relname,
          'name', a.attname
        )
        order by array_position(i.indkey, a.attnum)
      ) as primary_keys
    from
      pg_index i
      join pg_class c on i.indrelid = c.oid
      join pg_namespace n on c.relnamespace = n.oid
      join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
    where
      i.indisprimary${pkScope}
    group by c.oid
  ) as pk
  on pk.table_id = c.oid
  left join (
    select
      c.oid :: int8 as id,
      c.conname as constraint_name,
      nsa.nspname as source_schema,
      csa.relname as source_table_name,
      sa.attname as source_column_name,
      nta.nspname as target_table_schema,
      cta.relname as target_table_name,
      ta.attname as target_column_name
    from
      pg_constraint c
    join (
      pg_attribute sa
      join pg_class csa on sa.attrelid = csa.oid
      join pg_namespace nsa on csa.relnamespace = nsa.oid
    ) on sa.attrelid = c.conrelid and sa.attnum = any (c.conkey)
    join (
      pg_attribute ta
      join pg_class cta on ta.attrelid = cta.oid
      join pg_namespace nta on cta.relnamespace = nta.oid
    ) on ta.attrelid = c.confrelid and ta.attnum = any (c.confkey)
    where
      c.contype = 'f'${relScope}
  ) as relationships
  on (relationships.source_schema = nc.nspname and relationships.source_table_name = c.relname)
  or (relationships.target_table_schema = nc.nspname and relationships.target_table_name = c.relname)
WHERE
  c.relkind IN ('r', 'p')
  AND NOT pg_is_other_temp_schema(nc.oid)
  AND (
    pg_has_role(c.relowner, 'USAGE')
    OR has_table_privilege(
      c.oid,
      'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
    )
    OR has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
  )${mainScope}
group by
  c.oid,
  c.relname,
  c.relrowsecurity,
  c.relforcerowsecurity,
  c.relreplident,
  nc.nspname,
  pk.primary_keys
`
}

// FROZEN legacy path: the unscoped rendering served while the
// pgMetaScopedIntrospection flag is off. Do not edit its shape -- it must keep
// matching production behavior until the flag cleanup deletes it. The scoped
// form is getTablesSql(targetOid) (used by tables.retrieve).
export const TABLES_SQL = getTablesSql()
