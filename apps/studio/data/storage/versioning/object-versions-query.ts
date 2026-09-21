import { queryOptions } from '@tanstack/react-query'
import { components } from 'api-types'

import { storageKeys } from '../keys'
import { handleError, post } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

type StorageObject = components['schemas']['StorageObject_Output']

/**
 * What produced a version. A `delete marker` is the empty placeholder S3 writes
 * to the top of the version stack on a soft delete; it can outlive the delete
 * (delete → upload → delete → restore leaves one mid-history), so a live file's
 * history can contain them.
 *
 * A restore is a copy of an older version over the current one, which the list
 * endpoint reports exactly like any other overwrite — there is no provenance
 * field to tell them apart, so restores read as overwrites.
 */
export type ObjectVersionAction = 'initial upload' | 'overwrite' | 'delete marker'

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
  /** The object's full path within the bucket, not just its leaf name. */
  path?: string
  lifecyclePolicy?: LifecyclePolicy
}

export type ObjectVersionsError = ResponseError

// One object's history. The ceiling the list endpoint accepts.
const MAX_VERSIONS = 1000

/**
 * Newest first. The oldest surviving upload is labelled as the initial one, which
 * is only true while it hasn't expired out of the history — there is no flag for
 * it, and calling the oldest row an overwrite would be wrong more often.
 */
export const toObjectVersions = (objects: StorageObject[]): ObjectVersion[] => {
  const versions = objects
    .filter((object) => !!object.version)
    .map((object) => ({
      versionId: object.version as string,
      size: Number(object.metadata?.size ?? 0),
      createdAt: object.created_at ?? object.updated_at ?? '',
      isCurrent: !object.archived_at,
      isDeleteMarker: !!object.is_delete_marker,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const oldestUploadIndex = versions.reduce(
    (oldest, version, index) => (version.isDeleteMarker ? oldest : index),
    -1
  )

  return versions.map(({ isDeleteMarker, ...version }, index) => {
    if (isDeleteMarker) return { ...version, action: 'delete marker' as const }
    return {
      ...version,
      action: index === oldestUploadIndex ? ('initial upload' as const) : ('overwrite' as const),
    }
  })
}

async function getObjectVersions(
  { projectRef, bucketId, path }: ObjectVersionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!path) throw new Error('path is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/list', {
    params: { path: { ref: projectRef, id: bucketId } },
    body: {
      path,
      options: {
        limit: MAX_VERSIONS,
        // Without `exactMatch` the path is read as a folder prefix, which would
        // return every sibling's versions alongside this object's.
        exactMatch: true,
        noncurrentVersions: 'include',
        deleteMarkers: 'include',
      },
    },
    signal,
  })

  if (error) handleError(error)
  return toObjectVersions(data ?? [])
}

export type ObjectVersionsData = Awaited<ReturnType<typeof getObjectVersions>>

export const objectVersionsQueryOptions = ({
  projectRef,
  bucketId,
  path,
  lifecyclePolicy,
}: ObjectVersionsVariables) =>
  queryOptions({
    queryKey: storageKeys.objectVersions(projectRef, bucketId, path, lifecyclePolicy),
    queryFn: ({ signal }) => getObjectVersions({ projectRef, bucketId, path }, signal),
    enabled:
      IS_PLATFORM &&
      typeof projectRef !== 'undefined' &&
      typeof bucketId !== 'undefined' &&
      typeof path !== 'undefined',
  })
