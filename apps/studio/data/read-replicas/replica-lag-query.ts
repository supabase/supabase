import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { replicaKeys } from './keys'

export const replicationLagSql = () => {
  const sql = /* SQL */ `
select 
  case
    when (select count(*) from pg_stat_wal_receiver) = 1 and pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()
    then 0
    else coalesce(extract(epoch from now() - pg_last_xact_replay_timestamp()),0)
  end as physical_replica_lag_second
  `

  return sql
}

export type ReplicationLagVariables = {
  id: string
  projectRef?: string
  connectionString?: string
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
  }: UseQueryOptions<ReplicationLagData, ReplicationLagError, TData> = {}
) =>
  useQuery<ReplicationLagData, ReplicationLagError, TData>(
    replicaKeys.replicaLag(projectRef, id),
    ({ signal }) => getReplicationLag({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )
