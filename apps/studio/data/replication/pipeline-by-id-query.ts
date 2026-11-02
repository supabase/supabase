import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { pipelineIdSchema } from './pipeline-id'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationPipelineByIdParams = { projectRef?: string; pipelineId?: string }

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

  return { ...data, id: pipelineIdSchema.parse(data.id) }
}

export type ReplicationPipelineByIdData = Awaited<ReturnType<typeof fetchReplicationPipelineById>>

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
