import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from '../keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

/**
 * What produced a version. A `delete marker` is the empty placeholder S3 writes
 * to the top of the version stack on a soft delete; it can outlive the delete
 * (delete → upload → delete → restore leaves one mid-history), so a live file's
 * history can contain them.
 */
export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'restore' | 'delete marker'

export interface ObjectVersion {
  versionId: string
  size: number
  createdAt: string
  /** The version served when the object is fetched without a version ID. */
  isCurrent: boolean
  action: ObjectVersionAction
}

/** The bucket's lifecycle policy, which determines when each version expires. */
export interface LifecyclePolicy {
  /** `null` when no age condition is set. */
  expiryDays: number | null
  /** `null` when no version cap is set. */
  maxVersions: number | null
}

export type ObjectVersionsVariables = {
  projectRef?: string
  bucketId?: string
  objectName?: string
  lifecyclePolicy?: LifecyclePolicy
}

export type ObjectVersionsError = ResponseError

async function getObjectVersions(
  { projectRef, bucketId, objectName }: ObjectVersionsVariables,
  _signal?: AbortSignal
): Promise<ObjectVersion[]> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!objectName) throw new Error('objectName is required')

  // TODO(storage-versioning): replace with the real endpoint once Storage exposes
  // it, following the standard `get()` + `handleError()` shape. Every object
  // reports no versions until then.
  return []
}

export type ObjectVersionsData = Awaited<ReturnType<typeof getObjectVersions>>

export const objectVersionsQueryOptions = ({
  projectRef,
  bucketId,
  objectName,
  lifecyclePolicy,
}: ObjectVersionsVariables) =>
  queryOptions({
    queryKey: storageKeys.objectVersions(projectRef, bucketId, objectName, lifecyclePolicy),
    queryFn: ({ signal }) => getObjectVersions({ projectRef, bucketId, objectName }, signal),
    enabled:
      IS_PLATFORM &&
      typeof projectRef !== 'undefined' &&
      typeof bucketId !== 'undefined' &&
      typeof objectName !== 'undefined',
  })
