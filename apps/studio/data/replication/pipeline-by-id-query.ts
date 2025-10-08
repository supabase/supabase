import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
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

export type ReplicationPipelineByIdData = Awaited<ReturnType<typeof fetchReplicationPipelineById>>

export const useReplicationPipelineByIdQuery = <TData = ReplicationPipelineByIdData>(
  { projectRef, pipelineId }: ReplicationPipelineByIdParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationPipelineByIdData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineByIdData, ResponseError, TData>(
    replicationKeys.pipelineById(projectRef, pipelineId),
    ({ signal }) => fetchReplicationPipelineById({ projectRef, pipelineId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
      ...options,
    }
  )
