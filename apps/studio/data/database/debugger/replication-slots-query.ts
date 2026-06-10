import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from '../keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { UseCustomQueryOptions } from '@/types'

export type ReplicationSlotsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export interface ReplicationSlotsRow {
  slot_name: string
  active: boolean
  state: string
  replication_client_address: string
  replication_lag_gb: number
}

export const replicationSlotsSql = safeSql`
SELECT
  s.slot_name,
  s.active,
  COALESCE(r.state, 'N/A') AS state,
  CASE WHEN r.client_addr IS NULL
    THEN 'N/A'
    ELSE r.client_addr::text
  END AS replication_client_address,
  GREATEST(0, ROUND((redo_lsn - restart_lsn) / 1024 / 1024 / 1024, 2)) AS replication_lag_gb
FROM pg_control_checkpoint(), pg_replication_slots s
LEFT JOIN pg_stat_replication r ON (r.pid = s.active_pid)
`

export async function getReplicationSlots(
  { projectRef, connectionString }: ReplicationSlotsVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<ReplicationSlotsRow[]>(
    {
      projectRef,
      connectionString,
      sql: replicationSlotsSql,
      queryKey: ['debugger-replication-slots'],
    },
    signal
  )
  return result
}

export type ReplicationSlotsData = Awaited<ReturnType<typeof getReplicationSlots>>
export type ReplicationSlotsError = ExecuteSqlError

export const useReplicationSlotsQuery = <TData = ReplicationSlotsData>(
  { projectRef, connectionString }: ReplicationSlotsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationSlotsData, ReplicationSlotsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ReplicationSlotsData, ReplicationSlotsError, TData>({
    queryKey: databaseKeys.debuggerReplicationSlots(projectRef),
    queryFn: ({ signal }) => getReplicationSlots({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
