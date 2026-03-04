import { Query } from '@supabase/pg-meta/src/query'
import {
  COUNT_ESTIMATE_SQL,
  THRESHOLD_COUNT,
} from '@supabase/pg-meta/src/sql/studio/get-count-estimate'

import { GetTableRowsCountArgs } from './table-rows-count-query'
import { formatFilterValue } from './utils'

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
}: GetTableRowsCountArgs & { isUsingReadReplica?: boolean }) => {
  if (!table) return ``

  if (enforceExactCount) {
    const query = new Query()
    let queryChains = query.from(table.name, table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value !== '')
      .forEach((x) => {
        const value = formatFilterValue(table, x)
        queryChains = queryChains.filter(x.column, x.operator, value)
      })
    return `select (${queryChains.toSql().slice(0, -1)}), false as is_estimate;`
  } else {
    const selectQuery = new Query()
    let selectQueryChains = selectQuery.from(table.name, table.schema ?? undefined).select('*')
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        const value = formatFilterValue(table, x)
        selectQueryChains = selectQueryChains.filter(x.column, x.operator, value)
      })
    const selectBaseSql = selectQueryChains.toSql()

    const countQuery = new Query()
    let countQueryChains = countQuery.from(table.name, table.schema ?? undefined).count()
    filters
      .filter((x) => x.value && x.value != '')
      .forEach((x) => {
        const value = formatFilterValue(table, x)
        countQueryChains = countQueryChains.filter(x.column, x.operator, value)
      })
    const countBaseSql = countQueryChains.toSql().slice(0, -1)

    if (isUsingReadReplica) {
      const sql = `
with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${table.id}
)
select 
  case 
    when estimate > ${THRESHOLD_COUNT} then (select -1)
    else (${countBaseSql})
  end as count,
  estimate > ${THRESHOLD_COUNT} as is_estimate
from approximation;
`.trim()

      return sql
    } else {
      const sql = `
${COUNT_ESTIMATE_SQL}

with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${table.id}
)
select 
  case 
    when estimate > ${THRESHOLD_COUNT} then ${filters.length > 0 ? `pg_temp.count_estimate('${selectBaseSql.replaceAll("'", "''")}')` : 'estimate'}
    else (${countBaseSql})
  end as count,
  estimate > ${THRESHOLD_COUNT} as is_estimate
from approximation;
`.trim()

      return sql
    }
  }
}
