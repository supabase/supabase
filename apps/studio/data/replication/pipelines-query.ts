import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelinesParams = { projectRef?: string }

async function fetchReplicationPipelines(
  { projectRef }: ReplicationPipelinesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/pipelines', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationPipelinesData = Awaited<ReturnType<typeof fetchReplicationPipelines>>

export const useReplicationPipelinesQuery = <TData = ReplicationPipelinesData>(
  { projectRef }: ReplicationPipelinesParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationPipelinesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelinesData, ResponseError, TData>(
    replicationKeys.pipelines(projectRef),
    ({ signal }) => fetchReplicationPipelines({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
