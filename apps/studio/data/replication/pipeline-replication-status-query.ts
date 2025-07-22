import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelineReplicationStatusParams = { projectRef?: string; pipelineId?: number }

export type ReplicationPipelineReplicationStatusData = {
  pipeline_id: number
  table_statuses: Array<{
    table_name: string
    state: 
      | { name: 'queued' }
      | { name: 'copying_table' }
      | { name: 'copied_table' }
      | { name: 'following_wal'; lag: number }
      | { name: 'error'; message: string }
  }>
}

async function fetchReplicationPipelineReplicationStatus(
  { projectRef, pipelineId }: ReplicationPipelineReplicationStatusParams,
  signal?: AbortSignal
): Promise<ReplicationPipelineReplicationStatusData> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')

  // Temporary implementation - in real usage, this would call the actual API endpoint
  const response = await fetch(`/platform/replication/${projectRef}/pipelines/${pipelineId}/replication-status`, {
    signal,
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch replication status')
  }
  
  const data = await response.json()
  return data as ReplicationPipelineReplicationStatusData
}

export const useReplicationPipelineReplicationStatusQuery = <TData = ReplicationPipelineReplicationStatusData>(
  { projectRef, pipelineId }: ReplicationPipelineReplicationStatusParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationPipelineReplicationStatusData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineReplicationStatusData, ResponseError, TData>(
    replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId),
    ({ signal }) => fetchReplicationPipelineReplicationStatus({ projectRef, pipelineId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
      ...options,
    }
  )