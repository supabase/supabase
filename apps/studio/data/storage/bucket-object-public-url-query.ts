import { queryOptions } from '@tanstack/react-query'

import { storageKeys } from './keys'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'
import type { ResponseError } from '@/types'

export type BucketObjectPublicUrlVariables = {
  projectRef?: string
  clientEndpoint?: string
  bucketId?: string
  path: string
  /** Resolves a specific version of the object. Defaults to the current one. */
  versionId?: string
}

export async function getBucketObjectPublicUrl({
  projectRef,
  clientEndpoint,
  bucketId,
  path,
  versionId,
}: BucketObjectPublicUrlVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!clientEndpoint) throw new Error('clientEndpoint is required')
  if (!bucketId) throw new Error('bucketId is required')

  const supabaseClient = await createProjectSupabaseClient(projectRef, clientEndpoint)
  // Omitted rather than sent as `undefined`, so current-version URLs are unchanged.
  const { data } = supabaseClient.storage
    .from(bucketId)
    .getPublicUrl(path, versionId === undefined ? undefined : { versionId })

  return data.publicUrl
}

export type BucketObjectPublicUrlData = Awaited<ReturnType<typeof getBucketObjectPublicUrl>>
export type BucketObjectPublicUrlError = ResponseError

// Shares its key with the file URL of a public bucket, so both resolve to the same cached string.
export const bucketObjectPublicUrlQueryOptions = ({
  projectRef,
  clientEndpoint,
  bucketId,
  path,
  versionId,
}: BucketObjectPublicUrlVariables) =>
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- clientEndpoint is derived from projectRef
  queryOptions({
    queryKey: storageKeys.fileUrl({ projectRef, isBucketPublic: true, bucketId, path, versionId }),
    queryFn: () =>
      getBucketObjectPublicUrl({ projectRef, clientEndpoint, bucketId, path, versionId }),
    enabled:
      typeof projectRef !== 'undefined' &&
      typeof clientEndpoint !== 'undefined' &&
      typeof bucketId !== 'undefined',
  })
