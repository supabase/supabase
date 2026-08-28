import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from '../keys'
import type { ObjectVersionAction } from './object-versions-query'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export interface ArchivedObjectVersion {
  versionId: string
  size: number
  createdAt: string
  action: ObjectVersionAction
}

export interface ArchivedObject {
  id: string
  /** Full path including the file name. Only `getArchivedSegments` splits it. */
  path: string
  archivedAt: string
  /**
   * The version that was live when the object was archived. S3 puts a delete
   * marker on top of the stack; this UI hides that and surfaces the version
   * underneath as an ordinary history entry.
   */
  currentVersion: ArchivedObjectVersion
  /** Newest first. */
  noncurrentVersions: ArchivedObjectVersion[]
}

export type ArchivedObjectsVariables = {
  projectRef?: string
  bucketId?: string
}

export type ArchivedObjectsError = ResponseError

async function getArchivedObjects(
  { projectRef, bucketId }: ArchivedObjectsVariables,
  _signal?: AbortSignal
): Promise<ArchivedObject[]> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  // TODO(storage-versioning): real endpoint once Storage exposes it.
  return []
}

export type ArchivedObjectsData = Awaited<ReturnType<typeof getArchivedObjects>>

export const archivedObjectsQueryOptions = ({ projectRef, bucketId }: ArchivedObjectsVariables) =>
  queryOptions({
    queryKey: storageKeys.archivedObjects(projectRef, bucketId),
    queryFn: ({ signal }) => getArchivedObjects({ projectRef, bucketId }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
  })
