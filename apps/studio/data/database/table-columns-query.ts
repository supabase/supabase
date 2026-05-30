import { getTableColumnsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type TableColumn = {
  schemaname: string
  tablename: string
  quoted_name: string
  is_table: boolean
  columns: any[]
}

export type TableColumnsVariables = {
  projectRef?: string
  connectionString?: string | null
  table?: string
  schema?: string
}

export async function getTableColumns(
  { projectRef, connectionString, table, schema }: TableColumnsVariables,
  signal?: AbortSignal
) {
  const sql = getTableColumnsSql({ table, schema })

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['table-columns', schema, table] },
    signal
  )

  return result as TableColumn[]
}

export type TableColumnsData = Awaited<ReturnType<typeof getTableColumns>>
export type TableColumnsError = ExecuteSqlError

export const useTableColumnsQuery = <TData = TableColumnsData>(
  { projectRef, connectionString, schema, table }: TableColumnsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableColumnsData, TableColumnsError, TData> = {}
) =>
  useQuery<TableColumnsData, TableColumnsError, TData>({
    queryKey: databaseKeys.tableColumns(projectRef, schema, table),
    queryFn: ({ signal }) =>
      getTableColumns({ projectRef, connectionString, schema, table }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
