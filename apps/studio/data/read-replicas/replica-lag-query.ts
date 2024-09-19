import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

export const replicationLagQuery = () => {
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

export type ReplicationLagData = number
export type ReplicationLagError = ExecuteSqlError

export const useReplicationLagQuery = <TData extends ReplicationLagData = ReplicationLagData>(
  { projectRef, connectionString, id }: ReplicationLagVariables,
  { enabled, ...options }: UseQueryOptions<ExecuteSqlData, ReplicationLagError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: replicationLagQuery(),
      queryKey: ['replica-lag', id],
    },
    {
      select(data) {
        return Number((data.result[0] ?? null)?.physical_replica_lag_second ?? 0) as TData
      },
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )
