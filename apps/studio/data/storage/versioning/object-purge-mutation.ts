import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { objectVersionsQueryOptions } from './object-versions-query'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type ObjectPurgeVariables = {
  projectRef: string
  bucketId: string
  /** The object's full path within the bucket, not just its leaf name. */
  path: string
}

/**
 * Permanently removes an object and every version of it. There is no single
 * endpoint for this: a bare path only hides whatever is current, so the history
 * is read first and each version deleted by id. Delete markers are included —
 * leaving one behind would keep the object listed as archived.
 */
export const useObjectPurgeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<void, ResponseError, ObjectPurgeVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  const purgeObject = async ({ projectRef, bucketId, path }: ObjectPurgeVariables) => {
    if (!projectRef) throw new Error('projectRef is required')
    if (!bucketId) throw new Error('bucketId is required')
    if (!path) throw new Error('path is required')

    const versions = await queryClient.fetchQuery(
      objectVersionsQueryOptions({ projectRef, bucketId, path })
    )

    // A bucket that was never versioned has no version ids to address, so the
    // bare path is the only way to name the object.
    const paths =
      versions.length > 0
        ? versions.map((version) => ({ path, versionId: version.versionId }))
        : [path]

    const { error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
      params: { path: { ref: projectRef, id: bucketId } },
      body: { paths },
    })

    if (error) handleError(error)
  }

  return useMutation<void, ResponseError, ObjectPurgeVariables>({
    mutationFn: purgeObject,
    async onSuccess(data, variables, context) {
      // The object list lives in the explorer's own state, not React Query, so
      // callers refresh it through their existing delete flow.
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
      if (onError === undefined) toast.error(`Failed to delete object: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
