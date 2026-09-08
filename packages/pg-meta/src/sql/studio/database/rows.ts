import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { Filter, Query } from '../../../query'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT, THRESHOLD_ESTIMATE_BYTES } from './get-count-estimate'

/**
 * Row-count for a table. reltuples = -1 (never analyzed) covers BOTH an
 * empty/small new table and a freshly bulk-loaded huge one, so the opt-in
 * `scoped` path gates on the real heap size (pg_relation_size, + pg_partition_tree
 * sum for partitioned parents whose own size is 0; relpages is equally stale
 * pre-vacuum): large -> EXPLAIN estimate, small/empty -> exact count. scoped=false
 * is byte-identical to the legacy query. Full matrix in rows-count.test.ts.
 */
export const getTableRowsCountSql = ({
  table,
  filters = [],
  enforceExactCount = false,
  isReadOnlyContext = false,
  scoped = false,
}: {
  table: any
  filters?: Filter[]
  enforceExactCount?: boolean
  /** Skips using the count estimate function if true and fallsback to checking reltuples from pg_class  */
  isReadOnlyContext?: boolean
  /** Opt-in optimized counting; gates never-analyzed tables on real heap size. */
  scoped?: boolean
}): SafeSqlFragment => {
  if (!table) return safeSql``

  if (enforceExactCount) {
    const query = new Query()
    let queryChains = query.from(table.name, table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value !== '')
      .forEach((x) => {
        queryChains = queryChains.filter(x.column, x.operator, x.value)
      })
    const queryChainsSql = queryChains.toSql()
    const queryChainsSqlWithoutSemicolon = queryChainsSql.endsWith(';')
      ? (queryChainsSql.slice(0, -1) as SafeSqlFragment)
      : queryChainsSql
    return safeSql`select (${queryChainsSqlWithoutSemicolon}), false as is_estimate;`
  } else {
    const selectQuery = new Query()
    let selectQueryChains = selectQuery.from(table.name, table.schema ?? undefined).select()
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        selectQueryChains = selectQueryChains.filter(x.column, x.operator, x.value)
      })
    const selectBaseSql = selectQueryChains.toSql()
    const selectBaseSqlWithoutSemicolon = selectBaseSql.endsWith(';')
      ? (selectBaseSql.slice(0, -1) as SafeSqlFragment)
      : selectBaseSql

    const countQuery = new Query()
    let countQueryChains = countQuery.from(table.name, table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        countQueryChains = countQueryChains.filter(x.column, x.operator, x.value)
      })
    const countBaseSql = countQueryChains.toSql()
    const countBaseSqlWithoutSemicolon = countBaseSql.endsWith(';')
      ? (countBaseSql.slice(0, -1) as SafeSqlFragment)
      : countBaseSql

    if (isReadOnlyContext) {
      if (scoped) {
        // Readonly can't create the pg_temp function: an over-threshold or
        // physically-large never-analyzed table reports -1 (is_estimate=true);
        // a small/empty one still gets an exact count. CASE and flag share the
        // condition.
        const sql = safeSql`
with approximation as (
    select
      reltuples as estimate,
      -- Whole-tree heap size. A partitioned PARENT (relkind 'p') has no storage
      -- of its own, so its size is the sum over pg_partition_tree; every other
      -- relkind uses its own heap directly (pg_partition_tree returns NO rows
      -- for a plain non-partitioned table, so it cannot be used unconditionally).
      -- Views/foreign tables yield 0 (-> exact count, unchanged behavior).
      case when relkind = 'p'
        then (select coalesce(sum(pg_relation_size(relid)), 0) from pg_partition_tree(oid))
        else pg_relation_size(oid)
      end as bytes
    from pg_class
    where oid = ${literal(table.id)}
)
select
  case
    when estimate > ${literal(THRESHOLD_COUNT)} or (estimate = -1 and bytes > ${literal(THRESHOLD_ESTIMATE_BYTES)}) then -1
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  (estimate > ${literal(THRESHOLD_COUNT)} or (estimate = -1 and bytes > ${literal(THRESHOLD_ESTIMATE_BYTES)})) as is_estimate
from approximation;
`

        return sql
      }
      // FROZEN legacy path (pgMetaScopedIntrospection off): do not edit -- it
      // must keep matching production behavior until the flag cleanup deletes it.
      const sql = safeSql`
with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${literal(table.id)}
)
select 
  case 
    when estimate > ${literal(THRESHOLD_COUNT)} then (select -1)
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  estimate > ${literal(THRESHOLD_COUNT)} as is_estimate
from approximation;
`

      return sql
    } else {
      if (scoped) {
        // estimate = -1 (never analyzed) gated on heap size (see CTE): large ->
        // EXPLAIN estimate, small/empty -> exact count (avoids Postgres's ~10-page
        // phantom estimate). Over-threshold keeps legacy behavior. CASE and flag
        // share the condition. literal() quotes the embedded select so backslash
        // identifiers survive under any standard_conforming_strings.
        const estimateExpr = safeSql`pg_temp.count_estimate(${literal(selectBaseSqlWithoutSemicolon)})`
        const sql = safeSql`
${COUNT_ESTIMATE_SQL}

with approximation as (
    select
      reltuples as estimate,
      -- Whole-tree heap size. A partitioned PARENT (relkind 'p') has no storage
      -- of its own, so its size is the sum over pg_partition_tree; every other
      -- relkind uses its own heap directly (pg_partition_tree returns NO rows
      -- for a plain non-partitioned table, so it cannot be used unconditionally).
      -- Views/foreign tables yield 0 (-> exact count, unchanged behavior).
      case when relkind = 'p'
        then (select coalesce(sum(pg_relation_size(relid)), 0) from pg_partition_tree(oid))
        else pg_relation_size(oid)
      end as bytes
    from pg_class
    where oid = ${literal(table.id)}
)
select
  case
    when estimate = -1 and bytes > ${literal(THRESHOLD_ESTIMATE_BYTES)} then ${estimateExpr}
    when estimate > ${literal(THRESHOLD_COUNT)} then ${filters.length > 0 ? estimateExpr : safeSql`estimate`}
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  (estimate > ${literal(THRESHOLD_COUNT)} or (estimate = -1 and bytes > ${literal(THRESHOLD_ESTIMATE_BYTES)})) as is_estimate
from approximation;
`

        return sql
      }
      // FROZEN legacy path (pgMetaScopedIntrospection off): do not edit -- it
      // must keep matching production behavior until the flag cleanup deletes it.
      const sql = safeSql`
${COUNT_ESTIMATE_SQL}

with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${literal(table.id)}
)
select 
  case 
    when estimate > ${literal(THRESHOLD_COUNT)} then ${filters.length > 0 ? safeSql`pg_temp.count_estimate('${selectBaseSqlWithoutSemicolon.replaceAll("'", "''") as SafeSqlFragment}')` : safeSql`estimate`}
    else (${countBaseSqlWithoutSemicolon})
  end as count,
  estimate > ${literal(THRESHOLD_COUNT)} as is_estimate
from approximation;
`

      return sql
    }
  }
}
