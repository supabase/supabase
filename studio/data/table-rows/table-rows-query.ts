import { QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { Filter, Query, Sort, SupaRow, SupaTable } from 'components/grid'
import { isNumericalColumn } from 'components/grid/utils'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { getPagination } from '../utils/pagination'

type GetTableRowsArgs = {
  table?: SupaTable
  filters?: Filter[]
  sorts?: Sort[]
  limit?: number
  page?: number
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

  let queryChains = query.from(table.name, table.schema ?? undefined).select()

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

export const useTableRowsPrefetch = ({
  projectRef,
  connectionString,
  queryKey,
  table,
  ...args
}: TableRowsVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getTableRowsSqlQuery({ table, ...args }),
    queryKey: [
      ...(queryKey ?? []),
      { table: { name: table?.name, schema: table?.schema }, ...args },
    ],
  })
}

/**
 * temporary fix until we implement a better filter UI
 * which validate input value base on the column type
 */
export function formatFilterValue(table: SupaTable, filter: Filter) {
  const column = table.columns.find((x) => x.name == filter.column)
  if (column && isNumericalColumn(column.format)) {
    const numberValue = Number(filter.value)
    if (Number.isNaN(numberValue)) return filter.value
    else return Number(filter.value)
  }
  return filter.value
}
