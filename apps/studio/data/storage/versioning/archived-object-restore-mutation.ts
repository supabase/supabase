import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import type { ResponseError } from '@/types'

export type ArchivedObjectRestoreVariables = {
  projectRef: string
  bucketId: string
  archivedObjectId: string
}

async function restoreArchivedObject({
  projectRef,
  bucketId,
  archivedObjectId,
}: ArchivedObjectRestoreVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!archivedObjectId) throw new Error('archivedObjectId is required')

  // TODO(storage-versioning): real endpoint once Storage exposes it.
  throw new Error('Restoring an archived file is not available yet')
}

export const useArchivedObjectRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<void, ResponseError, ArchivedObjectRestoreVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, ResponseError, ArchivedObjectRestoreVariables>({
    mutationFn: restoreArchivedObject,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.archivedObjects(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to restore file: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
