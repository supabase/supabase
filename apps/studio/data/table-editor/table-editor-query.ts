import { getTableEditorSql } from '@supabase/pg-meta'
import { QueryClient, queryOptions, useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { tableEditorKeys } from './keys'
import { Entity } from './table-editor-types'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { ResponseError, UseCustomQueryOptions } from '@/types'

export const PG_META_SCOPED_INTROSPECTION_FLAG = 'pgMetaScopedIntrospection'

type TableEditorArgs = {
  id?: number
  scoped?: boolean
}

export type TableEditorVariables = TableEditorArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTableEditor(
  { projectRef, connectionString, id, scoped = false }: TableEditorVariables,
  signal?: AbortSignal
) {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = getTableEditorSql({ id, scoped })
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
export type TableEditorError = ResponseError

export const useTableEditorQuery = <TData = TableEditorData>(
  { projectRef, connectionString, id }: TableEditorVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableEditorData, TableEditorError, TData> = {}
) => {
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  return useQuery<TableEditorData, TableEditorError, TData>({
    ...tableEditorQueryOptions({ projectRef, connectionString, id, scoped }),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function prefetchTableEditor(
  client: QueryClient,
  { projectRef, connectionString, id, scoped }: TableEditorVariables
) {
  return client.fetchQuery(tableEditorQueryOptions({ projectRef, connectionString, id, scoped }))
}

export const tableEditorQueryOptions = <TData = TableEditorData>({
  projectRef,
  connectionString,
  id,
  scoped,
}: TableEditorVariables) => {
  return queryOptions<TableEditorData, TableEditorError, TData>({
    queryKey: [...tableEditorKeys.tableEditor(projectRef, id), { scoped: !!scoped }],
    queryFn: ({ signal }) => getTableEditor({ projectRef, connectionString, id, scoped }, signal),
  })
}
