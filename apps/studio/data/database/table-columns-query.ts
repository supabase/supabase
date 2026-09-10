import { getTableColumnsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { isScopedIntrospection, scopedIntrospectionReady } from '@/data/scoped-introspection'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, UseCustomQueryOptions } from '@/types'

export type TableColumn = {
  schemaname: string
  tablename: string
  quoted_name: string
  is_table: boolean
  /**
   * The legacy (pgMetaScopedIntrospection off) query also carries attrelid,
   * attnum and attisdropped, and emits a single `null` entry for a relation the
   * role can access but has no readable column on. The scoped query emits only
   * these two fields, ordered by attnum, and an empty array in that case --
   * so consumers must still tolerate null entries until the flag is cleaned up.
   */
  columns: Array<{ attname: string; data_type: string } | null>
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
  // Cold-load race guard -- see the module comment on scoped-introspection.ts.
  await scopedIntrospectionReady()
  const sql = getTableColumnsSql({ table, schema, scoped: isScopedIntrospection() })

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['table-columns', schema, table] },
    signal
  )

  return result as TableColumn[]
}

export type TableColumnsData = Awaited<ReturnType<typeof getTableColumns>>
export type TableColumnsError = ResponseError

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
