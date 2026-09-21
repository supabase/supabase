import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { objectVersionsQueryOptions } from './object-versions-query'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type ArchivedObjectPurgeVariables = {
  projectRef: string
  bucketId: string
  archivedObjectId: string
  /** The object's full path within the bucket. */
  path: string
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

  /**
   * Every retained version goes, the delete marker included — leaving the marker
   * behind would keep the object listed as archived with nothing under it.
   */
  const purgeArchivedObject = async ({
    projectRef,
    bucketId,
    archivedObjectId,
    path,
  }: ArchivedObjectPurgeVariables) => {
    if (!projectRef) throw new Error('projectRef is required')
    if (!bucketId) throw new Error('bucketId is required')
    if (!archivedObjectId) throw new Error('archivedObjectId is required')
    if (!path) throw new Error('path is required')

    const versions = await queryClient.fetchQuery(
      objectVersionsQueryOptions({ projectRef, bucketId, path })
    )

    const versionIds = new Set(versions.map((version) => version.versionId))
    versionIds.add(archivedObjectId)

    const { error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
      params: { path: { ref: projectRef, id: bucketId } },
      body: { paths: [...versionIds].map((versionId) => ({ path, versionId })) },
    })

    if (error) handleError(error)
  }

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
