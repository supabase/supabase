import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { listBucketObjects, type StorageObject } from './bucket-objects-list-mutation'
import { storageKeys } from './keys'
import type { components } from '@/data/api'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

const DEFAULT_LIMIT = 200

type StorageObjectsQueryParams = {
  projectRef?: string
  bucketId?: string
  path: string
  options?: Omit<NonNullable<components['schemas']['GetObjectsBody']['options']>, 'offset'>
}

export type StorageObjectsData = StorageObject[]
export type StorageObjectsError = ResponseError

export const useBucketObjectsInfiniteQuery = <TData = StorageObjectsData>(
  { projectRef, bucketId, path, options }: StorageObjectsQueryParams,
  {
    enabled = true,
    ...queryOptions
  }: UseCustomInfiniteQueryOptions<
    StorageObjectsData,
    StorageObjectsError,
    InfiniteData<TData>,
    readonly unknown[],
    number
  > = {}
) => {
  const limit = options?.limit ?? DEFAULT_LIMIT

  return useInfiniteQuery({
    queryKey: storageKeys.objects(projectRef, bucketId, path, options),
    queryFn: ({ signal, pageParam }) =>
      listBucketObjects(
        {
          projectRef: projectRef!,
          bucketId,
          path,
          options: { ...options, limit, offset: pageParam * limit },
        },
        signal
      ) as Promise<StorageObjectsData>,
    enabled: enabled && !!projectRef && !!bucketId,
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      if (lastPage.length < limit) return undefined
      return pages.length
    },
    ...queryOptions,
  })
}
