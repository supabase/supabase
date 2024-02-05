import { QueryKey, UseQueryOptions } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import { Filter, Query, Sort, SupaRow, SupaTable } from 'components/grid'
import {
  ImpersonationRole,
  ROLE_IMPERSONATION_NO_RESULTS,
  wrapWithRoleImpersonation,
} from 'lib/role-impersonation'
import { useIsRoleImpersonationEnabled } from 'state/role-impersonation-state'
import { ExecuteSqlData, executeSql, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { getPagination } from '../utils/pagination'
import { formatFilterValue } from './utils'

type GetTableRowsArgs = {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
  impersonatedRole?: ImpersonationRole
}

export const fetchAllTableRows = async ({
  projectRef,
  connectionString,
  table,
  filters = [],
  sorts = [],
  impersonatedRole,
}: {
  projectRef: string
  connectionString?: string
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  impersonatedRole?: ImpersonationRole
}) => {
  if (IS_PLATFORM && !connectionString) {
    console.error('Connection string is required')
    return []
  }

  const rows: any[] = []
  const query = new Query()

  let queryChains = query.from(table.name, table.schema ?? undefined).select()
  filters
    .filter((filter) => filter.value && filter.value !== '')
    .forEach((filter) => {
      const value = formatFilterValue(table, filter)
      queryChains = queryChains.filter(filter.column, filter.operator, value)
    })
  sorts.forEach((sort) => {
    queryChains = queryChains.order(sort.column, sort.ascending, sort.nullsFirst)
  })

  // Starting from page 0, fetch 500 records per call
  let page = -1
  let from = 0
  let to = 0
  let pageData = []
  const rowsPerPage = 500

  await (async () => {
    do {
      page += 1
      from = page * rowsPerPage
      to = (page + 1) * rowsPerPage - 1
      const query = wrapWithRoleImpersonation(queryChains.range(from, to).toSql(), {
        projectRef,
        role: impersonatedRole,
      })

      try {
        const { result } = await executeSql({ projectRef, connectionString, sql: query })
        rows.push(...result)
        pageData = result
      } catch (error) {
        return { data: { rows: [] } }
      }
    } while (pageData.length === rowsPerPage)
  })()

  return rows.filter((row) => row[ROLE_IMPERSONATION_NO_RESULTS] !== 1)
}

export const getTableRowsSqlQuery = ({
  table,
  filters = [],
  sorts = [],
  page,
  limit,
}: GetTableRowsArgs) => {
  const query = new Query()

  if (!table) {
    return ``
  }

  const enumArrayColumns = table.columns
    .filter((column) => {
      return (column?.enum ?? []).length > 0 && column.dataType.toLowerCase() === 'array'
    })
    .map((column) => column.name)

  let queryChains =
    enumArrayColumns.length > 0
      ? query
          .from(table.name, table.schema ?? undefined)
          .select(`*,${enumArrayColumns.map((x) => `"${x}"::text[]`).join(',')}`)
      : query.from(table.name, table.schema ?? undefined).select()

  filters
    .filter((x) => x.value && x.value != '')
    .forEach((x) => {
      const value = formatFilterValue(table, x)
      queryChains = queryChains.filter(x.column, x.operator, value)
    })
  sorts.forEach((x) => {
    queryChains = queryChains.order(x.column, x.ascending, x.nullsFirst)
  })

  // getPagination is expecting to start from 0
  const { from, to } = getPagination((page ?? 1) - 1, limit)
  const sql = queryChains.range(from, to).toSql()

  return sql
}

export type TableRows = {
  rows: SupaRow[]
}

export type TableRowsVariables = GetTableRowsArgs & {
  projectRef?: string
  connectionString?: string
  queryKey?: QueryKey
}

export type TableRowsData = TableRows
export type TableRowsError = unknown

export const useTableRowsQuery = <TData extends TableRowsData = TableRowsData>(
  { projectRef, connectionString, queryKey, table, impersonatedRole, ...args }: TableRowsVariables,
  options: UseQueryOptions<ExecuteSqlData, TableRowsError, TData> = {}
) => {
  const isRoleImpersonationEnabled = useIsRoleImpersonationEnabled()

  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: wrapWithRoleImpersonation(getTableRowsSqlQuery({ table, ...args }), {
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
        const rows = data.result.map((x: any, index: number) => {
          return { idx: index, ...x } as SupaRow
        })

        return {
          rows,
        } as TData
      },
      enabled: typeof projectRef !== 'undefined' && typeof table !== 'undefined',
      ...options,
    }
  )
}
