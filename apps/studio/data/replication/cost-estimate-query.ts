import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationCostEstimateParams = {
  projectRef?: string
  sourceId?: number
  publicationName?: string
  clusterId?: string
}

async function fetchReplicationCostEstimate(
  { projectRef, sourceId, publicationName }: ReplicationCostEstimateParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')
  if (!publicationName) throw new Error('publicationName is required')

  const { data, error } = await get(
    '/platform/replication/{ref}/sources/{source_id}/publications/{publication_name}/cost-estimate',
    {
      params: {
        path: { ref: projectRef, source_id: sourceId, publication_name: publicationName },
      },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationCostEstimateData = Awaited<ReturnType<typeof fetchReplicationCostEstimate>>

export const useReplicationCostEstimateQuery = <TData = ReplicationCostEstimateData>(
  {
    projectRef,
    sourceId,
    publicationName,
    clusterId: requestedClusterId,
  }: ReplicationCostEstimateParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationCostEstimateData, StudioError, TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery<ReplicationCostEstimateData, StudioError, TData>({
    queryKey: replicationKeys.costEstimate(projectRef, sourceId, publicationName, clusterId),
    queryFn: ({ signal }) =>
      fetchReplicationCostEstimate({ projectRef, sourceId, publicationName }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof sourceId !== 'undefined' &&
      typeof publicationName !== 'undefined' &&
      publicationName.length > 0,
    ...options,
  })
}
