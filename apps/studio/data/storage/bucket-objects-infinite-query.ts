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
    queryFn: async ({ signal, pageParam }) => {
      const page = (await listBucketObjectsV2(
        {
          projectRef: projectRef!,
          bucketId,
          prefix,
          cursor: pageParam,
          options: { ...v2Options, limit },
        },
        signal
      )) as StorageObjectsPage

      // A backend that says there's more but doesn't advance the cursor would otherwise
      // send fetchNextPage into an infinite loop re-fetching the same page forever.
      if (page.hasNext && (!page.nextCursor || page.nextCursor === pageParam)) {
        throw new Error('Storage list-v2 response has hasNext=true without a new cursor')
      }

      return page
    },
    enabled: enabled && !!projectRef && !!bucketId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
  })
}
