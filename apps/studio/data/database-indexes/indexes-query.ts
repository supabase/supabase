import { getIndexesSQL } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseIndexesKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

type GetIndexesArgs = {
  schema?: string
}

export type DatabaseIndex = {
  name: string
  schema: string
  table: string
  definition: string
  columns: string // Comma-separated strings
}

export type IndexesVariables = GetIndexesArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getIndexes(
  { schema, projectRef, connectionString }: IndexesVariables,
  signal?: AbortSignal
) {
  if (!schema) {
    throw new Error('schema is required')
  }

  const sql = getIndexesSQL({ schema })

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['indexes', schema] },
    signal
  )

  return result as DatabaseIndex[]
}

export type IndexesData = Awaited<ReturnType<typeof getIndexes>>
export type IndexesError = ExecuteSqlError

export const useIndexesQuery = <TData = IndexesData>(
  { projectRef, connectionString, schema }: IndexesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<IndexesData, IndexesError, TData> = {}
) =>
  useQuery<IndexesData, IndexesError, TData>({
    queryKey: databaseIndexesKeys.list(projectRef, schema),
    queryFn: ({ signal }) => getIndexes({ projectRef, connectionString, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
    ...options,
  })
