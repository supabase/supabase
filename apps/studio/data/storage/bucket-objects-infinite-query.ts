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
  // A trailing slash is required to browse a folder's contents with with_delimiter: true —
  // without it, v2 treats e.g. "docs" as a partial name match against siblings like "docs-old"
  // rather than descending into the folder.
  const browsePrefix = path ? `${path}/` : ''
  const prefix = search ? `${browsePrefix}${search}` : browsePrefix
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
      ),
    enabled: enabled && !!projectRef && !!bucketId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      if (!lastPage.hasNext) return undefined
      // A backend that says there's more but doesn't advance the cursor would otherwise send
      // fetchNextPage into an infinite loop re-fetching the same page forever; treat it as the
      // end of the list instead.
      if (!lastPage.nextCursor || lastPage.nextCursor === lastPageParam) return undefined
      return lastPage.nextCursor
    },
  })
}
