import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type ObjectVersionDeleteVariables = {
  projectRef: string
  bucketId: string
  /** The object's full path within the bucket, not just its leaf name. */
  path: string
  versionId: string
}

/** Addressing a version explicitly is a hard delete even on a versioned bucket. */
async function deleteObjectVersion({
  projectRef,
  bucketId,
  path,
  versionId,
}: ObjectVersionDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!bucketId) throw new Error('bucketId is required')
  if (!path) throw new Error('path is required')
  if (!versionId) throw new Error('versionId is required')

  const { error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
    params: { path: { ref: projectRef, id: bucketId } },
    body: { paths: [{ path, versionId }] },
  })

  if (error) handleError(error)
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
          variables.path
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
