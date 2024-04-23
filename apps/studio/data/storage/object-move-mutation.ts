import { useMutation } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'

type MoveStorageObjectParams = {
  projectRef: string
  bucketId?: string
  from: string
  to: string
}
export const moveStorageObject = async ({
  projectRef,
  bucketId,
  from,
  to,
}: MoveStorageObjectParams) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post('/platform/storage/{ref}/buckets/{id}/objects/move', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      from,
      to,
    },
  })

  if (error) handleError(error)
  return data
}

export function useBucketObjectsMoveMutation() {
  return useMutation({
    mutationFn: moveStorageObject,
  })
}
