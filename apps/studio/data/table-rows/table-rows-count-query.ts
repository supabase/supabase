import { QueryClient, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { Query } from 'components/grid/query/Query'
import { parseSupaTable } from 'components/grid/SupabaseGrid.utils'
import type { Filter, SupaTable } from 'components/grid/types'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { ImpersonationRole, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableRowKeys } from './keys'
import { formatFilterValue } from './utils'

type GetTableRowsCountArgs = {
  table?: SupaTable
  filters?: Filter[]
  enforceExactCount?: boolean
}

export const THRESHOLD_COUNT = 50000
const COUNT_ESTIMATE_SQL = /* SQL */ `
CREATE OR REPLACE FUNCTION pg_temp.count_estimate(
    query text
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
    plan jsonb;
BEGIN
    EXECUTE 'EXPLAIN (FORMAT JSON)' || query INTO plan;
    RETURN plan->0->'Plan'->'Plan Rows';
END;
$$;
`.trim()

export const getTableRowsCountSql = ({
  table,
  filters = [],
  enforceExactCount = false,
}: GetTableRowsCountArgs) => {
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

    const sql = `
${COUNT_ESTIMATE_SQL}

with approximation as (
    select reltuples as estimate
    from pg_class
    where oid = ${table.id}
)
select 
  case 
    when estimate = -1 then (select pg_temp.count_estimate('${selectBaseSql.replaceAll("'", "''")}'))
    when estimate > ${THRESHOLD_COUNT} then ${filters.length > 0 ? `pg_temp.count_estimate('${selectBaseSql.replaceAll("'", "''")}')` : 'estimate'}
    else (${countBaseSql})
  end as count,
  estimate = -1 or estimate > ${THRESHOLD_COUNT} as is_estimate
from approximation;
`.trim()

    return sql
  }
}

export type TableRowsCount = {
  count: number
  is_estimate?: boolean
}

export type TableRowsCountVariables = Omit<GetTableRowsCountArgs, 'table'> & {
  queryClient: QueryClient
  tableId?: number
  impersonatedRole?: ImpersonationRole
  projectRef?: string
  connectionString?: string
}

export type TableRowsCountData = TableRowsCount
export type TableRowsCountError = ExecuteSqlError

export async function getTableRowsCount(
  {
    queryClient,
    projectRef,
    connectionString,
    tableId,
    filters,
    impersonatedRole,
    enforceExactCount,
  }: TableRowsCountVariables,
  signal?: AbortSignal
) {
  const entity = await prefetchTableEditor(queryClient, {
    projectRef,
    connectionString,
    id: tableId,
  })
  if (!entity) {
    throw new Error('Table not found')
  }

  const table = parseSupaTable(entity)

  const sql = wrapWithRoleImpersonation(
    getTableRowsCountSql({ table, filters, enforceExactCount }),
    {
      projectRef: projectRef ?? 'ref',
      role: impersonatedRole,
    }
  )
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['table-rows-count', table.id],
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(impersonatedRole),
    },
    signal
  )

  return {
    count: result[0].count,
    is_estimate: result[0].is_estimate ?? false,
  } as TableRowsCount
}

export const useTableRowsCountQuery = <TData = TableRowsCountData>(
  { projectRef, connectionString, tableId, ...args }: Omit<TableRowsCountVariables, 'queryClient'>,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TableRowsCountData, TableRowsCountError, TData> = {}
) => {
  const queryClient = useQueryClient()
  return useQuery<TableRowsCountData, TableRowsCountError, TData>(
    tableRowKeys.tableRowsCount(projectRef, { table: { id: tableId }, ...args }),
    ({ signal }) =>
      getTableRowsCount({ queryClient, projectRef, connectionString, tableId, ...args }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof tableId !== 'undefined',
      ...options,
    }
  )
}
