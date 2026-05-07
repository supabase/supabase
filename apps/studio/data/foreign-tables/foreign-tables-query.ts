import pgMeta from '@supabase/pg-meta'
import { PostgresView } from '@supabase/postgres-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { foreignTableKeys } from './keys'

export type ForeignTablesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
}

export async function getForeignTables(
  { projectRef, connectionString, schema }: ForeignTablesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: pgMeta.foreignTables.list(schema ? { includedSchemas: [schema] } : undefined).sql,
      queryKey: ['foreign-tables', schema],
    },
    signal
  )

  return result as PostgresView[]
}

export type ForeignTablesData = Awaited<ReturnType<typeof getForeignTables>>
export type ForeignTablesError = ResponseError

export const useForeignTablesQuery = <TData = ForeignTablesData>(
  { projectRef, connectionString, schema }: ForeignTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ForeignTablesData, ForeignTablesError, TData> = {}
) =>
  useQuery<ForeignTablesData, ForeignTablesError, TData>({
    queryKey: schema
      ? foreignTableKeys.listBySchema(projectRef, schema)
      : foreignTableKeys.list(projectRef),
    queryFn: ({ signal }) => getForeignTables({ projectRef, connectionString, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
