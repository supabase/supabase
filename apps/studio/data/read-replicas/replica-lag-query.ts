import { replicationLagSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { replicaKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type ReplicationLagVariables = {
  id: string
  projectRef?: string
  connectionString?: string | null
}

export async function getReplicationLag(
  { projectRef, connectionString, id }: ReplicationLagVariables,
  signal?: AbortSignal
) {
  const sql = replicationLagSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['replica-lag', id] },
    signal
  )

  return Number((result[0] ?? null)?.physical_replica_lag_second ?? 0)
}

export type ReplicationLagData = Awaited<ReturnType<typeof getReplicationLag>>
export type ReplicationLagError = ExecuteSqlError

export const useReplicationLagQuery = <TData = ReplicationLagData>(
  { projectRef, connectionString, id }: ReplicationLagVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationLagData, ReplicationLagError, TData> = {}
) =>
  useQuery<ReplicationLagData, ReplicationLagError, TData>({
    queryKey: replicaKeys.replicaLag(projectRef, id),
    queryFn: ({ signal }) => getReplicationLag({ projectRef, connectionString, id }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
