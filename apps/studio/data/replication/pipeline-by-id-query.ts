import { useQuery } from '@tanstack/react-query'

import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelineByIdParams = { projectRef?: string; pipelineId?: number }

async function fetchReplicationPipelineById(
  { projectRef, pipelineId }: ReplicationPipelineByIdParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')
  const { data, error } = await get('/platform/replication/{ref}/pipelines/{pipeline_id}', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationPipelineByIdData = components['schemas']['ReplicationPipelineResponse']

export const useReplicationPipelineByIdQuery = <TData = ReplicationPipelineByIdData>(
  { projectRef, pipelineId }: ReplicationPipelineByIdParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelineByIdData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineByIdData, ResponseError, TData>({
    queryKey: replicationKeys.pipelineById(projectRef, pipelineId),
    queryFn: ({ signal }) => fetchReplicationPipelineById({ projectRef, pipelineId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
    ...options,
  })
