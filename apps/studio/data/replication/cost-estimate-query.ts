import { useQuery } from '@tanstack/react-query'

// TEMPORARY — local design fixture, remove with data/replication/dev-fixtures.ts
import { getCostEstimateFixture, USE_REPLICATION_DEV_FIXTURES } from './dev-fixtures'
import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationCostEstimateParams = {
  projectRef?: string
  sourceId?: number
  publicationName?: string
}

async function fetchReplicationCostEstimate(
  { projectRef, sourceId, publicationName }: ReplicationCostEstimateParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')
  if (!publicationName) throw new Error('publicationName is required')

  // TEMPORARY — local design fixture, remove with data/replication/dev-fixtures.ts
  if (USE_REPLICATION_DEV_FIXTURES) return getCostEstimateFixture()

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
  { projectRef, sourceId, publicationName }: ReplicationCostEstimateParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationCostEstimateData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationCostEstimateData, ResponseError, TData>({
    queryKey: replicationKeys.costEstimate(projectRef, sourceId, publicationName),
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
