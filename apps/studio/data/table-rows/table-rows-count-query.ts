import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'

import { Filter, Query, SupaTable } from 'components/grid'
import { ImpersonationRole, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { useIsRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { formatFilterValue } from './utils'

type GetTableRowsCountArgs = {
  table?: SupaTable
  filters?: Filter[]
  impersonatedRole?: ImpersonationRole
}

export const getTableRowsCountSqlQuery = ({ table, filters = [] }: GetTableRowsCountArgs) => {
  const query = new Query()

  if (!table) {
    return ``
  }

  let queryChains = query.from(table.name, table.schema ?? undefined).count()
  filters
    .filter((x) => x.value && x.value != '')
    .forEach((x) => {
      const value = formatFilterValue(table, x)
      queryChains = queryChains.filter(x.column, x.operator, value)
    })

  const sql = queryChains.toSql()

  return sql
}

export type TableRowsCount = {
  count: number
}

export type TableRowsCountVariables = GetTableRowsCountArgs & {
  projectRef?: string
  connectionString?: string
  queryKey?: QueryKey
}

export type TableRowsCountData = TableRowsCount
export type TableRowsCountError = ExecuteSqlError

export const useTableRowsCountQuery = <TData extends TableRowsCountData = TableRowsCountData>(
  {
    projectRef,
    connectionString,
    queryKey,
    table,
    impersonatedRole,
    ...args
  }: TableRowsCountVariables,
  options: UseQueryOptions<ExecuteSqlData, TableRowsCountError, TData> = {}
) => {
  const isRoleImpersonationEnabled = useIsRoleImpersonationEnabled()

  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: wrapWithRoleImpersonation(getTableRowsCountSqlQuery({ table, ...args }), {
        projectRef: projectRef ?? 'ref',
        role: impersonatedRole,
      }),
      queryKey: [
        ...(queryKey ?? []),
        {
          table: { name: table?.name, schema: table?.schema },
          impersonatedRole,
          ...args,
        },
      ],
      isRoleImpersonationEnabled,
    },
    {
      select(data) {
        return {
          count: data.result[0].count,
        } as TData
      },
      enabled: typeof projectRef !== 'undefined' && typeof table !== 'undefined',
      ...options,
    }
  )
}
