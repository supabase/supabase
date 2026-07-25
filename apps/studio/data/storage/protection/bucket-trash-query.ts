import { useMutation, useQuery, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { getMockTrashObjects, mockDelay, type TrashObject } from './protection-mocks'

export type BucketTrashVariables = {
  projectRef?: string
  bucketId?: string
}

export const useBucketTrashQuery = ({ projectRef, bucketId }: BucketTrashVariables) =>
  useQuery<TrashObject[], Error>({
    queryKey: storageKeys.trash(projectRef, bucketId),
    queryFn: () => mockDelay(getMockTrashObjects(bucketId ?? '')),
    enabled: !!projectRef && !!bucketId,
  })

type TrashRestoreVariables = {
  projectRef: string
  bucketId: string
  objectId: string
}

/** Prototype: restoring a soft-deleted object promotes it back to current. */
export const useBucketTrashRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: UseMutationOptions<void, Error, TrashRestoreVariables> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, TrashRestoreVariables>({
    mutationFn: () => mockDelay(undefined, 500),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.trash(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to restore object: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
