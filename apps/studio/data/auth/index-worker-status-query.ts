import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql, type ExecuteSqlError } from 'data/sql/execute-sql-query'
import { UseCustomQueryOptions } from 'types'
import { authKeys } from './keys'

type IndexWorkerStatusVariables = {
  projectRef?: string
  connectionString?: string | null
}
type IndexWorkerStatusData = {
  is_in_progress: boolean
}
export type IndexWorkerStatusError = ExecuteSqlError

export async function getIndexWorkerStatus(
  { projectRef, connectionString }: IndexWorkerStatusVariables,
  signal?: AbortSignal
): Promise<IndexWorkerStatusData> {
  const sql = pgMeta.getIndexWorkerStatusSQL()

  const { result } = await executeSql<IndexWorkerStatusData[]>(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['index-worker-status'],
    },
    signal
  )

  return result[0]
}

export const useIndexWorkerStatusQuery = <TData = IndexWorkerStatusData>(
  { projectRef, connectionString }: IndexWorkerStatusVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<IndexWorkerStatusData, IndexWorkerStatusError, TData> = {}
) =>
  useQuery<IndexWorkerStatusData, IndexWorkerStatusError, TData>({
    queryKey: authKeys.indexWorkerStatus(projectRef),
    queryFn: ({ signal }) =>
      getIndexWorkerStatus(
        {
          projectRef,
          connectionString,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
