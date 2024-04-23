import { useMutation } from '@tanstack/react-query'

import { components } from 'data/api'
import { post } from 'data/fetchers'

type ListBucketObjectsParams = {
  projectRef: string
  bucketId: string
  path: string
  options: components['schemas']['StorageObjectSearchOptions']
}
const listBucketObjects = async ({
  projectRef,
  bucketId,
  path,
  options,
}: ListBucketObjectsParams) => {
  const res = await post('/platform/storage/{ref}/buckets/{id}/objects/list', {
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
  })

  return res
}

export function useBucketObjectsListMutation() {
  return useMutation({
    mutationFn: listBucketObjects,
  })
}
