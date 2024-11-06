import type { PostgresTable } from '@supabase/postgres-meta'

import { get, handleError } from 'data/fetchers'

export type TableVariables = {
  id?: number
  projectRef?: string
  connectionString?: string
}

export type Table = PostgresTable

export type TableResponse = Table | { error?: any }

/**
 * @deprecated use `useTableEditorQuery` instead
 */
export async function getTable(
  { id, projectRef, connectionString }: TableVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/tables', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      // @ts-ignore
      query: { id: id.toString() },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as unknown as PostgresTable
}
