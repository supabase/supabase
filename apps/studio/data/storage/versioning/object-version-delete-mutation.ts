import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import type { ResponseError } from '@/types'

export type ObjectVersionDeleteVariables = {
  projectRef: string
  bucketId: string
  objectName: string
  /** The single version to remove. Other versions of the object are untouched. */
  versionId: string
}

async function deleteObjectVersion({
  projectRef,
  bucketId,
  objectName,
  versionId,
}: ObjectVersionDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!objectName) throw new Error('objectName is required')
  if (!versionId) throw new Error('versionId is required')

  // TODO(storage-versioning): call the real endpoint once Storage exposes it.
  // Deleting a specific version is permanent even on a versioned bucket.
  throw new Error('Deleting a version is not available yet')
}

export const useObjectVersionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<void, ResponseError, ObjectVersionDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, ResponseError, ObjectVersionDeleteVariables>({
    mutationFn: deleteObjectVersion,
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({
        queryKey: storageKeys.objectVersions(
          variables.projectRef,
          variables.bucketId,
          variables.objectName
        ),
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
