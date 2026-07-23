import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { Filter, Query } from '../../../query'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT, THRESHOLD_ESTIMATE_BYTES } from './get-count-estimate'

/**
 * [Joshen] Initially check reltuples from pg_class for an estimate of row count on the table
 * - If reltuples = -1, table never been analyzed, assume small table -> return exact count
 * - If reltuples exceeds threshold, return estimate count
 * - Else return exact count
 *
 * The `reltuples = -1` assumption above is a latent bug on large, freshly
 * bulk-loaded (never-analyzed) tables: pg_class.reltuples is -1 until the first
 * ANALYZE, so the legacy path runs an exact `count(*)` and can hit a statement
 * timeout on a multi-million-row table. The opt-in `scoped` path fixes this
 * WITHOUT breaking the (also `reltuples = -1`) empty/small new-table case: for a
 * never-analyzed table it gates on the whole-tree heap size (pg_relation_size,
 * plus the pg_partition_tree sum for partitioned parents) against
 * THRESHOLD_ESTIMATE_BYTES -- a physically large one uses the EXPLAIN estimate
 * (non-readonly) or reports -1 (readonly), while a small/empty one still gets a
 * fast exact count instead of Postgres's ~10-page minimum phantom estimate.
 * `scoped` defaults to false so the behavior can be rolled out behind a feature
 * flag; the scoped=false rendering stays byte-identical to the current query.
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
  /**
   * Opt-in optimized counting: for a never-analyzed table (reltuples = -1) it
   * gates on the physical heap size so a large bulk-loaded table uses an
   * estimate (never a timing-out exact count) while a small/empty one still
   * returns an exact count. Defaults to false (legacy behavior).
   */
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
        // Readonly context cannot create the pg_temp.count_estimate function, so
        // an over-threshold table -- or a never-analyzed (estimate = -1) table
        // whose heap is physically large -- reports -1 with is_estimate=true
        // rather than running an exact count(*) that could time out. A
        // never-analyzed but physically SMALL table (incl. an empty new table:
        // reltuples is also -1 there) still gets an exact, fast count(*). The
        // CASE and the is_estimate flag use the same condition.
        const sql = safeSql`
with approximation as (
    select
      reltuples as estimate,
      -- Whole-tree heap size: pg_relation_size(oid) covers a plain table's own
      -- heap (pg_partition_tree returns NO rows for a non-partitioned table), and
      -- the pg_partition_tree sum covers a partitioned PARENT (relkind 'p') whose
      -- own storage is 0 but whose partitions hold the data. greatest() picks
      -- whichever applies; views/foreign tables yield 0 (-> exact count).
      greatest(
        pg_relation_size(oid),
        (select coalesce(sum(pg_relation_size(relid)), 0) from pg_partition_tree(oid))
      ) as bytes
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
        // A never-analyzed table reports estimate = -1, which covers BOTH a
        // freshly bulk-loaded huge table AND a brand-new empty/small one. Gate
        // that case on the whole-tree heap size (see the CTE below): only a
        // physically large -1 table uses the EXPLAIN estimate (which works
        // without ANALYZE); a small/empty -1 table falls through to an exact,
        // fast count(*) so it never reports Postgres's ~10-page minimum phantom
        // estimate. The
        // over-threshold branch keeps the legacy behavior (raw estimate when
        // unfiltered, count_estimate over the filtered select otherwise). The
        // CASE and is_estimate flag share one condition.
        const estimateExpr = safeSql`pg_temp.count_estimate('${selectBaseSqlWithoutSemicolon.replaceAll("'", "''") as SafeSqlFragment}')`
        const sql = safeSql`
${COUNT_ESTIMATE_SQL}

with approximation as (
    select
      reltuples as estimate,
      -- Whole-tree heap size: pg_relation_size(oid) covers a plain table's own
      -- heap (pg_partition_tree returns NO rows for a non-partitioned table), and
      -- the pg_partition_tree sum covers a partitioned PARENT (relkind 'p') whose
      -- own storage is 0 but whose partitions hold the data. greatest() picks
      -- whichever applies; views/foreign tables yield 0 (-> exact count).
      greatest(
        pg_relation_size(oid),
        (select coalesce(sum(pg_relation_size(relid)), 0) from pg_partition_tree(oid))
      ) as bytes
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
