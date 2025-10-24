import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

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
  return data as { vectorBucketName: string; creationTime: string }
}

export type VectorBucketData = Awaited<ReturnType<typeof getVectorBucket>>
export type VectorBucketError = ResponseError

export const useVectorBucketQuery = <TData = VectorBucketData>(
  { projectRef, vectorBucketName }: VectorBucketVariables,
  { enabled = true, ...options }: UseQueryOptions<VectorBucketData, VectorBucketError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<VectorBucketData, VectorBucketError, TData>({
    queryKey: storageKeys.vectorBucket(projectRef, vectorBucketName),
    queryFn: ({ signal }) => getVectorBucket({ projectRef, vectorBucketName }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
    retry: (failureCount, error) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        error.message.startsWith('Tenant config') &&
        error.message.endsWith('not found')
      ) {
        return false
      }

      if (failureCount < 3) {
        return true
      }

      return false
    },
  })
}
