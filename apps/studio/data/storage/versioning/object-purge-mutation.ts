import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import type { ResponseError } from '@/types'

export type ObjectPurgeVariables = {
  projectRef: string
  bucketId: string
  objectName: string
}

/**
 * Permanently removes an object and every version of it. On a versioned bucket an
 * ordinary delete only hides the object; this bypasses versioning entirely.
 */
async function purgeObject({ projectRef, bucketId, objectName }: ObjectPurgeVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!objectName) throw new Error('objectName is required')

  // TODO(storage-versioning): call the real endpoint once Storage exposes it.
  throw new Error('Permanently deleting an object is not available yet')
}

export const useObjectPurgeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<void, ResponseError, ObjectPurgeVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<void, ResponseError, ObjectPurgeVariables>({
    mutationFn: purgeObject,
    async onSuccess(data, variables, context) {
      // The object list lives in the explorer's own state, not React Query, so
      // callers refresh it through their existing delete flow.
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
      if (onError === undefined) toast.error(`Failed to delete object: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
