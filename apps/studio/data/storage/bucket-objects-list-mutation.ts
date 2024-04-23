import { useMutation } from '@tanstack/react-query'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'

type ListBucketObjectsParams = {
  projectRef: string
  bucketId?: string
  path: string
  options: components['schemas']['StorageObjectSearchOptions']
}

export type StorageObject = components['schemas']['StorageObject']

export const listBucketObjects = async (
  { projectRef, bucketId, path, options }: ListBucketObjectsParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/list', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      path,
      options,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export function useBucketObjectsListMutation() {
  return useMutation({
    mutationFn: listBucketObjects,
  })
}
