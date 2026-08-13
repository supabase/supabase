import pgMeta from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { tableKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError } from '@/types'

export type TableInaccessibleColumnsVariables = {
  projectRef?: string
  connectionString?: string | null
  name: string
  schema: string
}

/**
 * Column introspection drops columns the connected role holds no privilege on, so a
 * column picker built from it can come up short with nothing to explain why. This
 * reports what was dropped, letting those surfaces say so instead of appearing broken.
 */
async function getTableInaccessibleColumns(
  { projectRef, connectionString, name, schema }: TableInaccessibleColumnsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql, zod } = pgMeta.columns.listInaccessible({ schema, table: name })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: tableKeys.inaccessibleColumns(projectRef, name, schema),
    },
    signal
  )

  return zod.parse(result)
}

export type TableInaccessibleColumnsData = Awaited<ReturnType<typeof getTableInaccessibleColumns>>
export type TableInaccessibleColumnsError = ResponseError

export const tableInaccessibleColumnsQueryOptions = ({
  projectRef,
  connectionString,
  name,
  schema,
}: TableInaccessibleColumnsVariables) =>
  queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: tableKeys.inaccessibleColumns(projectRef, name, schema),
    queryFn: ({ signal }) =>
      getTableInaccessibleColumns({ projectRef, connectionString, name, schema }, signal),
    enabled: typeof projectRef !== 'undefined' && !!schema && !!name,
    staleTime: 5 * 60 * 1000,
  })
