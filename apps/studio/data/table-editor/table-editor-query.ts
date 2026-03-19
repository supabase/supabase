import { QueryClient, queryOptions, useQuery } from '@tanstack/react-query'
import { id } from 'common-tags'
import { UseCustomQueryOptions } from 'types'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableEditorKeys } from './keys'
import { getTableEditorSql } from './table-editor-query-sql'
import { Entity } from './table-editor-types'

type TableEditorArgs = {
  id?: number
}

export type TableEditorVariables = TableEditorArgs & {
  projectRef?: string
  connectionString?: string | null
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

  return (result[0]?.entity ?? null) as Entity | undefined
}

export type TableEditorData = Awaited<ReturnType<typeof getTableEditor>>
export type TableEditorError = ExecuteSqlError

export const useTableEditorQuery = <TData = TableEditorData>(
  { projectRef, connectionString, id }: TableEditorVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableEditorData, TableEditorError, TData> = {}
) =>
  useQuery<TableEditorData, TableEditorError, TData>({
    ...tableEditorQueryOptions({ projectRef, connectionString, id }),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  })

export function prefetchTableEditor(
  client: QueryClient,
  { projectRef, connectionString, id }: TableEditorVariables
) {
  return client.fetchQuery(tableEditorQueryOptions({ projectRef, connectionString, id }))
}

export const tableEditorQueryOptions = <TData = TableEditorData>({
  projectRef,
  connectionString,
  id,
}: TableEditorVariables) => {
  return queryOptions<TableEditorData, TableEditorError, TData>({
    queryKey: tableEditorKeys.tableEditor(projectRef, id),
    queryFn: ({ signal }) => getTableEditor({ projectRef, connectionString, id }, signal),
  })
}
