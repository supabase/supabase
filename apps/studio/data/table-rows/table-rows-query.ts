import { QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { Filter, Query, Sort, SupaRow, SupaTable } from 'components/grid'
import { useCallback } from 'react'
import {
  ExecuteSqlData,
  executeSql,
  useExecuteSqlPrefetch,
  useExecuteSqlQuery,
} from '../sql/execute-sql-query'
import { getPagination } from '../utils/pagination'
import { formatFilterValue } from './utils'

type GetTableRowsArgs = {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
}

// [Joshen] From components/grid/services/row/SqlRowService.ts, we should remove the logic from SqlRowService eventually
export const fetchAllTableRows = async ({
  projectRef,
  connectionString,
  table,
  filters = [],
  sorts = [],
}: {
  projectRef: string
  connectionString?: string
  table: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
}) => {
  if (!connectionString) {
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
      const query = queryChains.range(from, to).toSql()

      try {
        const { result } = await executeSql({ projectRef, connectionString, sql: query })
        rows.push(...result)
        pageData = result
      } catch (error) {
        return { data: { rows: [] } }
      }
    } while (pageData.length === rowsPerPage)
  })()

  return rows
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
  { projectRef, connectionString, queryKey, table, ...args }: TableRowsVariables,
  options: UseQueryOptions<ExecuteSqlData, TableRowsError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getTableRowsSqlQuery({ table, ...args }),
      queryKey: [
        ...(queryKey ?? []),
        { table: { name: table?.name, schema: table?.schema }, ...args },
      ],
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

/**
 * useTableRowsPrefetch is used for prefetching table rows. For example, starting a query loading before a page is navigated to.
 *
 * @example
 * const prefetch = useTableRowsPrefetch({ projectRef })
 *
 * return (
 *   <Link onMouseEnter={() => prefetch()}>
 *     Start loading on hover
 *   </Link>
 * )
 */
export const useTableRowsPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString, queryKey, table, ...args }: TableRowsVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getTableRowsSqlQuery({ table, ...args }),
        queryKey: [
          ...(queryKey ?? []),
          { table: { name: table?.name, schema: table?.schema }, ...args },
        ],
      }),
    [prefetch]
  )
}
