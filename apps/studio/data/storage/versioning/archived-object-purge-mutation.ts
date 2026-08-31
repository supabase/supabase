import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import type { ResponseError } from '@/types'

export type ArchivedObjectPurgeVariables = {
  projectRef: string
  bucketId: string
  archivedObjectId: string
}

async function purgeArchivedObject({
  projectRef,
  bucketId,
  archivedObjectId,
}: ArchivedObjectPurgeVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!archivedObjectId) throw new Error('archivedObjectId is required')

  // TODO(storage-versioning): real endpoint once Storage exposes it.
  throw new Error('Permanently deleting an archived file is not available yet')
}

export const useArchivedObjectPurgeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<void, ResponseError, ArchivedObjectPurgeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, ResponseError, ArchivedObjectPurgeVariables>({
    mutationFn: purgeArchivedObject,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.archivedObjects(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete file: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
