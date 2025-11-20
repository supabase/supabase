import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { useIsAnalyticsBucketsEnabled } from 'data/config/project-storage-config-query'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

export type AnalyticsBucketsVariables = { projectRef?: string }
export type AnalyticsBucket = components['schemas']['StorageAnalyticsBucketResponse']
export type AnalyticsBuckets = components['schemas'][]

export async function getAnalyticsBuckets(
  { projectRef }: AnalyticsBucketsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/analytics-buckets', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data.data
}

export type AnalyticsBucketsData = Awaited<ReturnType<typeof getAnalyticsBuckets>>
export type AnalyticsBucketsError = ResponseError

export const useAnalyticsBucketsQuery = <TData = AnalyticsBucketsData>(
  { projectRef }: AnalyticsBucketsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AnalyticsBucketsData, AnalyticsBucketsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const hasIcebergEnabled = useIsAnalyticsBucketsEnabled({ projectRef: project?.ref })

  return useQuery<AnalyticsBucketsData, AnalyticsBucketsError, TData>({
    queryKey: storageKeys.analyticsBuckets(projectRef),
    queryFn: ({ signal }) => getAnalyticsBuckets({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive && hasIcebergEnabled,
    ...options,
  })
}
