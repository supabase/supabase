import { infiniteQueryOptions } from '@tanstack/react-query'

import { listBucketObjectsV2 } from './bucket-objects-list-mutation'
import { storageKeys } from './keys'
import type { components } from '@/data/api'

const DEFAULT_LIMIT = 200

type StorageObjectsQueryParams = {
  projectRef?: string
  bucketId?: string
  path: string
  options?: Omit<
    components['schemas']['GetObjectsV2Body'],
    'prefix' | 'cursor' | 'with_delimiter'
  > & {
    /** Not a real v2 API field: folded into `prefix` so v2 returns entries starting with it */
    search?: string
  }
}

export type StorageObjectsPage = components['schemas']['StorageListResponseV2_Output']

export const bucketObjectsInfiniteQueryOptions = (
  { projectRef, bucketId, path, options }: StorageObjectsQueryParams,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const { search, ...v2Options } = options ?? {}
  const prefix = search ? `${path}${path ? '/' : ''}${search}` : path
  const limit = v2Options.limit ?? DEFAULT_LIMIT

  return infiniteQueryOptions({
    // prefix and search are incorporated into the path.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: storageKeys.objects(projectRef, bucketId, path, options),
    queryFn: ({ signal, pageParam }) =>
      listBucketObjectsV2(
        {
          projectRef: projectRef!,
          bucketId,
          prefix,
          cursor: pageParam,
          options: { ...v2Options, limit },
        },
        signal
      ) as Promise<StorageObjectsPage>,
    enabled: enabled && !!projectRef && !!bucketId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  })
}
