import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItemWithColumn } from '../Storage.types'
import { getArchivedObjectsUnderFolder } from './archivedOverlay.utils'
import { getStorageItemPath } from './StorageExplorer.utils'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { useArchivedObjectPurgeMutation } from '@/data/storage/versioning/archived-object-purge-mutation'
import { archivedObjectsQueryOptions } from '@/data/storage/versioning/archived-objects-query'
import { useObjectPurgeMutation } from '@/data/storage/versioning/object-purge-mutation'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/** Thrown once the user has already been told, so the catch below stays quiet for it. */
const TRUNCATED_LISTING = new Error('Archived listing truncated')

/** Mounted once by the explorer. Confirmed separately from `ConfirmDeleteModal`, which archives. */
export const ConfirmPurgeModal = () => {
  const {
    projectRef,
    selectedBucket,
    openedFolders,
    itemsToPurge,
    setItemsToPurge,
    selectedItems,
    clearSelectedItems,
    selectedFilePreview,
    refetchAllOpenedFolders,
    getAllItemsAlongFolder,
  } = useStorageExplorerStateSnapshot()
  const { clearPreviewedFile } = useStorageExplorerNavigation()
  const queryClient = useQueryClient()

  const [isPurging, setIsPurging] = useState(false)

  const { mutateAsync: purgeObject } = useObjectPurgeMutation()
  const { mutateAsync: purgeArchivedObject } = useArchivedObjectPurgeMutation()

  const [firstItem] = itemsToPurge
  const hasMultipleItems = itemsToPurge.length > 1
  const hasFolder = itemsToPurge.some((item) => item.type === STORAGE_ROW_TYPES.FOLDER)

  /** A folder is only a prefix, so both halves of what it holds have to go. */
  const purgeFolder = async (
    projectRef: string,
    bucketId: string,
    folder: StorageItemWithColumn,
    path: string
  ) => {
    const isArchivedFolder = folder.archived !== undefined
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
      throw TRUNCATED_LISTING
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

  const purgeItem = async (projectRef: string, bucketId: string, item: StorageItemWithColumn) => {
    // The endpoints address an object by full path; a row only knows its leaf name.
    // The path captured when the row was targeted beats rebuilding it from folders
    // that may have moved on; synthesized archived folders carry none, so they fall back.
    const path = item.path ?? getStorageItemPath({ openedFolders }, item)

    if (item.type === STORAGE_ROW_TYPES.FOLDER) {
      return purgeFolder(projectRef, bucketId, item, path)
    }
    await purgeObject({ projectRef, bucketId, path })
    return 0
  }

  const onConfirm = async () => {
    if (!projectRef || !selectedBucket?.id || itemsToPurge.length === 0) return

    const bucketId = selectedBucket.id
    setIsPurging(true)
    try {
      const results = await Promise.allSettled(
        itemsToPurge.map((item) => purgeItem(projectRef, bucketId, item))
      )

      results.forEach((result, index) => {
        const item = itemsToPurge[index]
        if (result.status !== 'rejected' || result.reason === TRUNCATED_LISTING) return
        if (item.type !== STORAGE_ROW_TYPES.FOLDER) return
        toast.error(`Failed to delete ${item.name}: ${(result.reason as Error).message}`)
      })

      // A rejected item failed whole; a resolved one reports what of its contents stayed.
      const failureCount = results.reduce(
        (total, result) => total + (result.status === 'rejected' ? 1 : result.value),
        0
      )

      if (failureCount > 0) {
        toast.error(`Could not delete ${failureCount} item${failureCount === 1 ? '' : 's'}`)
      } else {
        toast.success(
          hasMultipleItems
            ? `Permanently deleted ${itemsToPurge.length} items`
            : `Permanently deleted ${firstItem.name}`
        )
        const purgedIds = new Set(itemsToPurge.map((item) => item.id))
        const previewedId = selectedFilePreview?.id
        if (previewedId !== undefined && purgedIds.has(previewedId)) clearPreviewedFile()
        if (selectedItems.some((item) => purgedIds.has(item.id))) clearSelectedItems()
        setItemsToPurge([])
      }
    } finally {
      // Whatever did go through has already changed the listing.
      await refetchAllOpenedFolders()
      setIsPurging(false)
    }
  }

  const getAlertDescription = () => {
    if (hasMultipleItems) {
      return 'Deletes the selected files and every version of them, bypassing versioning. Nothing is left to restore.'
    }
    if (hasFolder) {
      return 'Deletes everything in this folder, archived files included, and every version of them. Nothing is left to restore.'
    }
    return 'Deletes the file and every version of it, bypassing versioning. Nothing is left to restore.'
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={itemsToPurge.length > 0}
      title={
        <span className="wrap-break-word">
          {hasMultipleItems
            ? `Permanently delete ${itemsToPurge.length} items?`
            : `Permanently delete ${firstItem?.name}?`}
        </span>
      }
      confirmLabel="Delete permanently"
      confirmLabelLoading="Deleting..."
      loading={isPurging}
      variant="destructive"
      onCancel={() => setItemsToPurge([])}
      onConfirm={onConfirm}
      alert={{
        base: { variant: 'destructive' },
        title: 'This cannot be undone',
        description: getAlertDescription(),
      }}
    />
  )
}
