import { queryOptions } from '@tanstack/react-query'

import { crawlBucket } from './bucket-crawl'
import { storageKeys } from './keys'
import type { ResponseError } from '@/types'

/** Cap on how many folders are collected */
const MAX_FOLDERS = 1000

export type StorageFolder = {
  name: string
  path: string
}

export type BucketFoldersVariables = {
  projectRef?: string
  bucketId?: string
}

export type BucketFoldersData = {
  folders: StorageFolder[]
  /** True when the crawl hit its limits, so `folders` is only part of the bucket */
  isTruncated: boolean
}

export type BucketFoldersError = ResponseError

/** Crawls a bucket for every folder in it, stopping early once `MAX_FOLDERS` is hit */
async function getBucketFolders(
  { projectRef, bucketId }: BucketFoldersVariables,
  signal?: AbortSignal
): Promise<BucketFoldersData> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')

  const folders: StorageFolder[] = []

  const { isTruncated } = await crawlBucket(
    {
      projectRef,
      bucketId,
      onPage: (objects, parentPath) => {
        for (const object of objects) {
          // Objects without an id are prefixes (folders) rather than files
          if (object.id) continue
          folders.push({
            name: object.name,
            path: parentPath.length > 0 ? `${parentPath}/${object.name}` : object.name,
          })
        }
        return folders.length < MAX_FOLDERS
      },
    },
    signal
  )

  return { folders: folders.slice(0, MAX_FOLDERS), isTruncated }
}

export const bucketFoldersQueryOptions = ({ projectRef, bucketId }: BucketFoldersVariables) =>
  queryOptions({
    queryKey: storageKeys.folders(projectRef, bucketId),
    queryFn: ({ signal }) => getBucketFolders({ projectRef, bucketId }, signal),
    enabled: typeof projectRef !== 'undefined' && typeof bucketId !== 'undefined',
    // The crawl is expensive, so hold onto the result for the lifetime of a picker session
    staleTime: 60 * 1000,
  })
