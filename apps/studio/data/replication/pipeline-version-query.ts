import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelineVersionParams = { projectRef?: string; pipelineId?: number }
type ReplicationPipelineVersionResponse =
  components['schemas']['ReplicationPipelineVersionResponse']

export async function fetchReplicationPipelineVersion(
  { projectRef, pipelineId }: ReplicationPipelineVersionParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')

  const { data, error } = await get('/platform/replication/{ref}/pipelines/{pipeline_id}/version', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type ReplicationPipelineVersionData = ReplicationPipelineVersionResponse

export const useReplicationPipelineVersionQuery = <TData = ReplicationPipelineVersionData>(
  { projectRef, pipelineId }: ReplicationPipelineVersionParams,
  {
    enabled = true,
    staleTime = Infinity,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    ...options
  }: UseQueryOptions<ReplicationPipelineVersionData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineVersionData, ResponseError, TData>(
    replicationKeys.pipelinesVersion(projectRef, pipelineId),
    ({ signal }) => fetchReplicationPipelineVersion({ projectRef, pipelineId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
      staleTime,
      refetchOnMount,
      refetchOnWindowFocus,
      ...options,
    }
  )
