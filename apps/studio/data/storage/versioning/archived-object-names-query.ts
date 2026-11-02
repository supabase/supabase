import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { listBucketObjectsV2 } from '../bucket-objects-list-mutation'
import { storageKeys } from '../keys'
import { dropPartialTrailingPath, toArchivedObjects } from './archived-objects-query'
import { EMPTY_FOLDER_PLACEHOLDER_FILE_NAME } from '@/components/interfaces/Storage/StorageExplorer/StorageExplorer.utils'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

type StorageObjectV2 = components['schemas']['StorageListResponseV2_Output']['objects'][number]

export type ArchivedObjectNamesVariables = {
  projectRef?: string
  bucketId?: string
  /** Bucket-relative folder path, empty at the root. */
  path: string
}

export type ArchivedObjectNamesError = ResponseError

/**
 * One page only. A folder holding more versioned rows than this just goes unchecked, which
 * is the behavior from before the prompt existed.
 */
const PAGE_SIZE = 1000

/**
 * Classified exactly the way the explorer's archived view classifies, so the prompt can never
 * claim something is archived that the user cannot find. `deleteMarkers: 'only'` is not enough
 * on its own: a purge can leave a delete marker with nothing retained underneath, and that
 * tombstone is not an archived file — there is nothing behind it to restore.
 *
 * v2 also returns `name` as the full key from the bucket root rather than a leaf, so a raw
 * comparison against an uploaded file's name matches nothing below the root.
 */
export const toArchivedFileNames = (objects: StorageObjectV2[] = [], hasNext = false): string[] => {
  // A page cap can cut one path's rows in half, and a fragment misclassifies either way.
  const rows = hasNext ? dropPartialTrailingPath(objects) : objects
  const names = toArchivedObjects(rows)
    .map((object) => object.path.split('/').pop() ?? '')
    .filter((name) => name.length > 0 && name !== EMPTY_FOLDER_PLACEHOLDER_FILE_NAME)
  return Array.from(new Set(names))
}

/** Names in one folder that the explorer would show under "Show archived". */
async function getArchivedObjectNames(
  { projectRef, bucketId, path }: ArchivedObjectNamesVariables,
  signal?: AbortSignal
): Promise<string[]> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  // Without the trailing slash v2 reads "docs" as a partial name match against siblings
  // like "docs-old" rather than descending into the folder.
  const prefix = path.length > 0 ? `${path}/` : ''

  const data = await listBucketObjectsV2(
    {
      projectRef,
      bucketId,
      prefix,
      // Whole history per path: deciding whether a path is archived takes the rows under the
      // current one, not just the markers.
      options: { limit: PAGE_SIZE, deleteMarkers: 'include', noncurrentVersions: 'include' },
    },
    signal
  )

  return toArchivedFileNames(data?.objects, data?.hasNext)
}

export type ArchivedObjectNamesData = Awaited<ReturnType<typeof getArchivedObjectNames>>

export const archivedObjectNamesQueryOptions = ({
  projectRef,
  bucketId,
  path,
}: ArchivedObjectNamesVariables) =>
  queryOptions({
    queryKey: storageKeys.archivedObjectNames(projectRef, bucketId, path),
    queryFn: ({ signal }) => getArchivedObjectNames({ projectRef, bucketId, path }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
  })
