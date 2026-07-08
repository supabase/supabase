import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { Filter, Query } from '../../../query'
import { COUNT_ESTIMATE_SQL, THRESHOLD_COUNT } from './get-count-estimate'

/**
 * [Joshen] Initially check reltuples from pg_class for an estimate of row count on the table
 * - If reltuples = -1, table never been analyzed, assume small table -> return exact count
 * - If reltuples exceeds threshold, return estimate count
 * - Else return exact count
 */
export const getTableRowsCountSql = ({
  table,
  filters = [],
  enforceExactCount = false,
  isUsingReadReplica = false,
}: {
  table: any
  filters?: Filter[]
  enforceExactCount?: boolean
  isUsingReadReplica?: boolean
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

    if (isUsingReadReplica) {
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
