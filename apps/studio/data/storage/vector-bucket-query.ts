import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { storageKeys } from './keys'

// [Joshen] JFYI typed incorrectly in API, to fix by adding creationTime to APi
export type VectorBucket = components['schemas']['StorageVectorBucketResponse'] & {
  creationTime: string
}

export type VectorBucketVariables = { projectRef?: string; vectorBucketName?: string }

export async function getVectorBucket(
  { projectRef, vectorBucketName }: VectorBucketVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!vectorBucketName) throw new Error('vectorBucketName is required')

  const { data, error } = await get('/platform/storage/{ref}/vector-buckets/{id}', {
    params: { path: { ref: projectRef, id: vectorBucketName } },
    signal,
  })

  if (error) handleError(error)
  return data as VectorBucket
}

export type VectorBucketData = Awaited<ReturnType<typeof getVectorBucket>>
export type VectorBucketError = ResponseError

export const useVectorBucketQuery = <TData = VectorBucketData>(
  { projectRef, vectorBucketName }: VectorBucketVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<VectorBucketData, VectorBucketError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<VectorBucketData, VectorBucketError, TData>({
    queryKey: storageKeys.vectorBucket(projectRef, vectorBucketName),
    queryFn: ({ signal }) => getVectorBucket({ projectRef, vectorBucketName }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
