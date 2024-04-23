import { useMutation } from '@tanstack/react-query'

import { components } from 'data/api'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

type DownloadBucketObjectParams = {
  projectRef: string
  bucketId?: string
  path: string
  options?: components['schemas']['DownloadObjectOptions']
}
export const downloadBucketObject = async (
  { projectRef, bucketId, path, options }: DownloadBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  // has to use lib/common/fetch post because the other post doesn't support wrapping blobs
  const response = await post(
    `${API_URL}/storage/${projectRef}/buckets/${bucketId}/objects/download`,
    {
      path,
      options,
      abortSignal: signal,
    }
  )

  if (response.error) throw response.error
  return response
}

export function useBucketObjectDownloadMutation() {
  return useMutation({
    mutationFn: downloadBucketObject,
  })
}
