import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

export type VectorBucketIndex =
  components['schemas']['StorageVectorBucketListIndexesResponse']['indexes'][number]
export type GetVectorBucketsIndexesVariables = { projectRef?: string; vectorBucketName?: string }

export async function getVectorBucketsIndexes(
  { projectRef, vectorBucketName }: GetVectorBucketsIndexesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!vectorBucketName) throw new Error('vectorBucketName is required')

  const { data, error } = await get('/platform/storage/{ref}/vector-buckets/{id}/indexes', {
    params: { path: { ref: projectRef, id: vectorBucketName } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type VectorBucketsIndexesData = Awaited<ReturnType<typeof getVectorBucketsIndexes>>
export type VectorBucketsIndexesError = ResponseError

export const useVectorBucketsIndexesQuery = <TData = VectorBucketsIndexesData>(
  { projectRef, vectorBucketName }: GetVectorBucketsIndexesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<VectorBucketsIndexesData, VectorBucketsIndexesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<VectorBucketsIndexesData, VectorBucketsIndexesError, TData>({
    queryKey: storageKeys.vectorBucketsIndexes(projectRef, vectorBucketName),
    queryFn: ({ signal }) => getVectorBucketsIndexes({ projectRef, vectorBucketName }, signal),
    enabled:
      enabled &&
      isActive &&
      typeof projectRef !== 'undefined' &&
      typeof vectorBucketName !== 'undefined',
    ...options,
  })
}
