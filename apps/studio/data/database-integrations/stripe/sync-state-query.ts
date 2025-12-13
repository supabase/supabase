import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { stripeSyncKeys } from './keys'

export type DbConnection = {
  projectRef: string
  connectionString?: string | null
}

const StripeSyncStateSchema = z
  .object({
    started_at: z.string().nullable(),
    closed_at: z.string().nullable(),
  })
  .nullable()

export type StripeSyncState = z.infer<typeof StripeSyncStateSchema>

export type StripeSyncStateData = z.infer<typeof StripeSyncStateSchema>
export type StypeSyncStateError = ExecuteSqlError

export async function getStripeSyncState(
  { projectRef, connectionString }: DbConnection,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: `
       SELECT started_at, closed_at FROM stripe._sync_run ORDER BY started_at DESC LIMIT 1;
      `,
      queryKey: stripeSyncKeys.syncState(projectRef),
    },
    signal
  )

  return result.length > 0 ? StripeSyncStateSchema.parse(result[0]) : null
}

export const useStripeSyncingState = <TData = StripeSyncStateData>(
  { projectRef, connectionString }: DbConnection,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<StripeSyncStateData, StypeSyncStateError, TData> = {}
) => {
  return useQuery<StripeSyncStateData, StypeSyncStateError, TData>({
    queryKey: stripeSyncKeys.syncState(projectRef),
    queryFn: ({ signal }) => getStripeSyncState({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

export function invalidateStripeSyncStateQuery(client: QueryClient, projectRef: string) {
  return client.invalidateQueries({ queryKey: stripeSyncKeys.syncState(projectRef) })
}
