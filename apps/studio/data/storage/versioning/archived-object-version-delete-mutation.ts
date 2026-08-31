import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import type { ResponseError } from '@/types'

export type ArchivedObjectVersionDeleteVariables = {
  projectRef: string
  bucketId: string
  archivedObjectId: string
  versionId: string
  /**
   * Deleting the version that was live at archive time promotes the next one
   * behind it, or removes the object when it was the last — hence the flag.
   */
  wasCurrentAtArchive: boolean
}

async function deleteArchivedObjectVersion({
  projectRef,
  bucketId,
  archivedObjectId,
  versionId,
}: ArchivedObjectVersionDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!archivedObjectId) throw new Error('archivedObjectId is required')
  if (!versionId) throw new Error('versionId is required')

  // TODO(storage-versioning): real endpoint once Storage exposes it.
  throw new Error('Deleting an archived version is not available yet')
}

export const useArchivedObjectVersionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<void, ResponseError, ArchivedObjectVersionDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, ResponseError, ArchivedObjectVersionDeleteVariables>({
    mutationFn: deleteArchivedObjectVersion,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.archivedObjects(variables.projectRef, variables.bucketId),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to delete version: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
