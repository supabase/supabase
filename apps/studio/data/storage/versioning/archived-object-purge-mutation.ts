import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { storageKeys } from '../keys'
import { objectVersionsQueryOptions, type ObjectVersion } from './object-versions-query'
import { del, handleError } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type ArchivedObjectPurgeVariables = {
  projectRef: string
  bucketId: string
  archivedObjectId: string
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

  /** Every retained version goes, the delete marker included. */
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

    const listVersions = () =>
      queryClient.fetchQuery({
        ...objectVersionsQueryOptions({ projectRef, bucketId, path }),
        // Each round has to see what the last one left behind, not the cached first page.
        staleTime: 0,
      })

    const deleteVersions = async (versions: ObjectVersion[]) => {
      const { error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
        params: { path: { ref: projectRef, id: bucketId } },
        body: { paths: versions.map((version) => ({ path, versionId: version.versionId })) },
      })

      if (error) handleError(error)
    }

    let versions = await listVersions()

    // Versions are deleted by id, the current one included, so a restore between opening the
    // dialog and confirming would hand this a live file to destroy. Re-reading the marker
    // immediately before the first delete is as close as the client can get; only Storage can
    // make the check and the delete one operation.
    const current = versions.find((version) => version.isCurrent)
    if (current?.action !== 'delete marker' || current.versionId !== archivedObjectId) {
      throw new Error(`${path} is no longer archived`)
    }

    // The list endpoint returns one capped page, so a longer history takes several rounds.
    // Stopping after the first would report a purge that left versions behind — and with the
    // marker gone, one of the survivors would become current again.
    while (versions.length > 0) {
      await deleteVersions(versions)

      const remaining = await listVersions()
      // Deleting the marker promotes nothing, so nothing here should be live. One that is
      // arrived while the purge was running — a restore, or a new upload to the same path —
      // and belongs to the user, not to the archive the next round would hand to `del`.
      const live = remaining.find((version) => version.isCurrent)
      if (live !== undefined && live.versionId !== archivedObjectId) {
        throw new Error(`${path} was restored or replaced while it was being deleted`)
      }
      // Nothing went away, so another round would spin rather than make progress.
      if (remaining.length >= versions.length) {
        throw new Error(`Some versions of ${path} could not be deleted`)
      }
      versions = remaining
    }
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
