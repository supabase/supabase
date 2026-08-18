import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import type { ResponseError } from '@/types'

export type ObjectVersionRestoreVariables = {
  projectRef: string
  bucketId: string
  objectName: string
  /** The noncurrent version to promote back to current. */
  versionId: string
}

async function restoreObjectVersion({
  projectRef,
  bucketId,
  objectName,
  versionId,
}: ObjectVersionRestoreVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!objectName) throw new Error('objectName is required')
  if (!versionId) throw new Error('versionId is required')

  // TODO(storage-versioning): call the real endpoint once Storage exposes it.
  // Restoring copies the version back over the object, which itself produces a
  // new noncurrent version of whatever was current.
  throw new Error('Restoring a version is not available yet')
}

export const useObjectVersionRestoreMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<void, ResponseError, ObjectVersionRestoreVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, ResponseError, ObjectVersionRestoreVariables>({
    mutationFn: restoreObjectVersion,
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
      if (onError === undefined) toast.error(`Failed to restore version: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
