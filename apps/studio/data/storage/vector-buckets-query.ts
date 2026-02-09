import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

export type VectorBucketsVariables = { projectRef?: string }

export async function getVectorBuckets(
  { projectRef }: VectorBucketsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/storage/{ref}/vector-buckets', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  // [Joshen] JFYI typed incorrectly in API, to fix by adding creationTime to API
  return data as { vectorBuckets: { vectorBucketName: string; creationTime: string }[] }
}

export type VectorBucketsData = Awaited<ReturnType<typeof getVectorBuckets>>
export type VectorBucketsError = ResponseError

export const useVectorBucketsQuery = <TData = VectorBucketsData>(
  { projectRef }: VectorBucketsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<VectorBucketsData, VectorBucketsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<VectorBucketsData, VectorBucketsError, TData>({
    queryKey: storageKeys.vectorBuckets(projectRef),
    queryFn: ({ signal }) => getVectorBuckets({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
