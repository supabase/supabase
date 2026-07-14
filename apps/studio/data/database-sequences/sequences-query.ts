import { getSequencesSQL } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseSequencesKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type DatabaseSequence = {
  id: number
  schema: string
  name: string
  owner: string
  data_type: string
  start_value: number | string
  increment_by: number | string
  max_value: number | string
  min_value: number | string
  cache_size: number | string
  cycle: boolean
  comment: string | null
  last_value: number | null
  owner_table: string | null
  owner_column: string | null
}

export type SequencesVariables = {
  schema?: string
  projectRef?: string
  connectionString?: string | null
}

export async function getSequences(
  { schema, projectRef, connectionString }: SequencesVariables,
  signal?: AbortSignal
) {
  if (!schema) throw new Error('schema is required')

  const sql = getSequencesSQL({ schema })

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['sequences', schema] },
    signal
  )

  return result as DatabaseSequence[]
}

export type SequencesData = Awaited<ReturnType<typeof getSequences>>
export type SequencesError = ExecuteSqlError

export const useSequencesQuery = <TData = SequencesData>(
  { projectRef, connectionString, schema }: SequencesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<SequencesData, SequencesError, TData> = {}
) =>
  useQuery<SequencesData, SequencesError, TData>({
    queryKey: databaseSequencesKeys.list(projectRef, schema),
    queryFn: ({ signal }) => getSequences({ projectRef, connectionString, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
    refetchInterval: 60_000,
    ...options,
  })
