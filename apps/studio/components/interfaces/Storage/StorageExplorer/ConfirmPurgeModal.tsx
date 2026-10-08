import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { getArchivedObjectsUnderFolder } from './archivedOverlay.utils'
import { getStorageItemPath } from './StorageExplorer.utils'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { useArchivedObjectPurgeMutation } from '@/data/storage/versioning/archived-object-purge-mutation'
import { archivedObjectsQueryOptions } from '@/data/storage/versioning/archived-objects-query'
import { useObjectPurgeMutation } from '@/data/storage/versioning/object-purge-mutation'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/** Mounted once by the explorer. Confirmed separately from `ConfirmDeleteModal`, which archives. */
export const ConfirmPurgeModal = () => {
  const {
    projectRef,
    selectedBucket,
    openedFolders,
    itemToPurge,
    setItemToPurge,
    selectedFilePreview,
    refetchAllOpenedFolders,
    getAllItemsAlongFolder,
  } = useStorageExplorerStateSnapshot()
  const { clearPreviewedFile } = useStorageExplorerNavigation()
  const queryClient = useQueryClient()

  const [isPurging, setIsPurging] = useState(false)

  const { mutateAsync: purgeObject } = useObjectPurgeMutation()
  const { mutateAsync: purgeArchivedObject } = useArchivedObjectPurgeMutation()

  const isFolder = itemToPurge?.type === STORAGE_ROW_TYPES.FOLDER
  const isArchivedFolder = isFolder && itemToPurge.archived !== undefined

  /** A folder is only a prefix, so both halves of what it holds have to go. */
  const purgeFolder = async (
    projectRef: string,
    bucketId: string,
    folder: NonNullable<typeof itemToPurge>,
    path: string
  ) => {
    const liveItems = isArchivedFolder ? [] : await getAllItemsAlongFolder(folder)

    // Not the overlay's copy: it is empty whenever "Show archived" is off, which would leave
    // every archived descendant behind while the purge reported success.
    const listing = await queryClient.fetchQuery({
      ...archivedObjectsQueryOptions({ projectRef, bucketId }),
      staleTime: 0,
    })
    if (listing.isTruncated) {
      toast.error(
        'This bucket holds more archived files than can be listed at once. Delete them one by one instead.'
      )
      throw new Error('Archived listing truncated')
    }

    const archivedUnder = getArchivedObjectsUnderFolder({
      folderSegments: path.split('/'),
      archivedObjects: listing.objects,
    })

    const results = await Promise.allSettled([
      ...liveItems.map((item) =>
        purgeObject({ projectRef, bucketId, path: `${item.prefix}/${item.name}` })
      ),
      ...archivedUnder.map((object) =>
        purgeArchivedObject({
          projectRef,
          bucketId,
          archivedObjectId: object.id,
          path: object.path,
        })
      ),
    ])

    return results.filter((result) => result.status === 'rejected').length
  }

  const onConfirm = async () => {
    if (!projectRef || !selectedBucket?.id || itemToPurge === undefined) return

    // The endpoints address an object by full path; a row only knows its leaf name.
    // The path captured when the row was targeted beats rebuilding it from folders
    // that may have moved on; synthesized archived folders carry none, so they fall back.
    const path = itemToPurge.path ?? getStorageItemPath({ openedFolders }, itemToPurge)
    setIsPurging(true)
    try {
      const failureCount = isFolder
        ? await purgeFolder(projectRef, selectedBucket.id, itemToPurge, path)
        : await purgeObject({ projectRef, bucketId: selectedBucket.id, path }).then(() => 0)

      if (failureCount > 0) {
        toast.error(`Could not delete ${failureCount} item${failureCount === 1 ? '' : 's'}`)
      } else {
        toast.success(`Permanently deleted ${itemToPurge.name}`)
        // Purging from a row menu shouldn't close a preview of something else.
        if (selectedFilePreview?.id === itemToPurge.id) clearPreviewedFile()
        setItemToPurge(undefined)
      }
    } catch {
      // Both the truncated listing and the mutations report their own failures.
    } finally {
      // Whatever did go through has already changed the listing.
      await refetchAllOpenedFolders()
      setIsPurging(false)
    }
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={itemToPurge !== undefined}
      title={<span className="wrap-break-word">Permanently delete {itemToPurge?.name}?</span>}
      confirmLabel="Delete permanently"
      confirmLabelLoading="Deleting..."
      loading={isPurging}
      variant="destructive"
      onCancel={() => setItemToPurge(undefined)}
      onConfirm={onConfirm}
      alert={{
        base: { variant: 'destructive' },
        title: 'This cannot be undone',
        description: isFolder
          ? 'Deletes everything in this folder, archived files included, and every version of them. Nothing is left to restore.'
          : 'Deletes the file and every version of it, bypassing versioning. Nothing is left to restore.',
      }}
    />
  )
}
