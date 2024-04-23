import { useMutation } from '@tanstack/react-query'

import { del, handleError } from 'data/fetchers'

type DownloadBucketObjectParams = {
  projectRef: string
  bucketId?: string
  paths: string[]
}
export const deleteBucketObject = async (
  { projectRef, bucketId, paths }: DownloadBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      paths,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export function useBucketObjectDeleteMutation() {
  return useMutation({
    mutationFn: deleteBucketObject,
  })
}
