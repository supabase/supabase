import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableEditorKeys } from './keys'
import { getTableEditorSql } from './table-editor-query-sql'
import { Entity } from './table-editor-types'

type TableEditorArgs = {
  id?: number
}

export type TableEditorVariables = TableEditorArgs & {
  projectRef?: string
  connectionString?: string
}

export async function getTableEditor(
  { projectRef, connectionString, id }: TableEditorVariables,
  signal?: AbortSignal
) {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = getTableEditorSql(id)
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['table-editor', id],
    },
    signal
  )

  return (result[0]?.entity ?? undefined) as Entity | undefined
}

export type TableEditorData = Awaited<ReturnType<typeof getTableEditor>>
export type TableEditorError = ExecuteSqlError

export const useTableEditorQuery = <TData = TableEditorData>(
  { projectRef, connectionString, id }: TableEditorVariables,
  { enabled = true, ...options }: UseQueryOptions<TableEditorData, TableEditorError, TData> = {}
) =>
  useQuery<TableEditorData, TableEditorError, TData>(
    tableEditorKeys.tableEditor(projectRef, id),
    ({ signal }) => getTableEditor({ projectRef, connectionString, id }, signal),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  )

export function prefetchTableEditor(
  client: QueryClient,
  { projectRef, connectionString, id }: TableEditorVariables
) {
  return client.fetchQuery(tableEditorKeys.tableEditor(projectRef, id), ({ signal }) =>
    getTableEditor(
      {
        projectRef,
        connectionString,
        id,
      },
      signal
    )
  )
}
