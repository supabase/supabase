import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type ArchivedObjectRestoreVariables = {
  projectRef: string
  bucketId: string
  /** The delete marker's version id, which is what identifies an archived object. */
  archivedObjectId: string
  /** The object's full path within the bucket. */
  path: string
}

/**
 * An archived object is one whose top version is a delete marker. Removing that
 * marker promotes the version underneath back to current, which brings the file
 * back into the live listing — nothing needs to be copied.
 */
async function restoreArchivedObject({
  projectRef,
  bucketId,
  archivedObjectId,
  path,
}: ArchivedObjectRestoreVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!archivedObjectId) throw new Error('archivedObjectId is required')
  if (!path) throw new Error('path is required')

  const { error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
    params: { path: { ref: projectRef, id: bucketId } },
    body: { paths: [{ path, versionId: archivedObjectId }] },
  })

  if (error) handleError(error)
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
