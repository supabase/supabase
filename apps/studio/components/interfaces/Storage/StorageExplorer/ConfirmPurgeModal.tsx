import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { useArchivedFilesContext } from './ArchivedFilesContext'
import { getArchivedObjectsUnderFolder } from './archivedOverlay.utils'
import { getPathAlongOpenedFolders } from './StorageExplorer.utils'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { useArchivedObjectPurgeMutation } from '@/data/storage/versioning/archived-object-purge-mutation'
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
  const { archivedObjects } = useArchivedFilesContext()

  const [isPurging, setIsPurging] = useState(false)

  const { mutateAsync: purgeObject } = useObjectPurgeMutation()
  const { mutateAsync: purgeArchivedObject } = useArchivedObjectPurgeMutation()

  const isFolder = itemToPurge?.type === STORAGE_ROW_TYPES.FOLDER
  const isArchivedFolder = isFolder && itemToPurge.archived !== undefined

  // The endpoints address an object by full path; a row only knows its leaf name.
  const getItemPath = () => {
    if (itemToPurge === undefined) return ''
    const folderPath = getPathAlongOpenedFolders(
      { openedFolders: openedFolders.slice(0, itemToPurge.columnIndex), selectedBucket },
      false
    )
    return [folderPath, itemToPurge.name].filter(Boolean).join('/')
  }

  /** A folder is only a prefix, so both halves of what it holds have to go. */
  const purgeFolder = async (
    projectRef: string,
    bucketId: string,
    folder: NonNullable<typeof itemToPurge>,
    path: string
  ) => {
    const liveItems = isArchivedFolder ? [] : await getAllItemsAlongFolder(folder)
    const archivedUnder = getArchivedObjectsUnderFolder({
      folderSegments: path.split('/'),
      archivedObjects,
    })

    await Promise.all([
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
  }

  const onConfirm = async () => {
    if (!projectRef || !selectedBucket?.id || itemToPurge === undefined) return

    const path = getItemPath()
    setIsPurging(true)
    try {
      if (isFolder) await purgeFolder(projectRef, selectedBucket.id, itemToPurge, path)
      else await purgeObject({ projectRef, bucketId: selectedBucket.id, path })

      toast.success(`Permanently deleted ${itemToPurge.name}`)
      // Purging from a row menu shouldn't close a preview of something else.
      if (selectedFilePreview?.id === itemToPurge.id) clearPreviewedFile()
      setItemToPurge(undefined)
      await refetchAllOpenedFolders()
    } catch {
      // The mutations report their own failures.
    } finally {
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
