import { toast } from 'sonner'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { getPathAlongOpenedFolders } from './StorageExplorer.utils'
import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { useObjectPurgeMutation } from '@/data/storage/versioning/object-purge-mutation'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/**
 * Mounted once by the explorer. A permanent delete is the escape hatch from
 * versioning — an ordinary delete on a versioned bucket only archives — so it is
 * confirmed separately from `ConfirmDeleteModal` and always reads as destructive.
 */
export const ConfirmPurgeModal = () => {
  const {
    projectRef,
    selectedBucket,
    openedFolders,
    itemToPurge,
    setItemToPurge,
    selectedFilePreview,
    refetchAllOpenedFolders,
  } = useStorageExplorerStateSnapshot()
  const { clearPreviewedFile } = useStorageExplorerNavigation()

  const { mutate: purgeObject, isPending: isPurging } = useObjectPurgeMutation({
    onSuccess: async () => {
      toast.success(`Permanently deleted ${itemToPurge?.name}`)
      // Only when the pane is showing the file that just went; purging from a row
      // menu shouldn't close a preview of something else.
      if (selectedFilePreview?.id === itemToPurge?.id) clearPreviewedFile()
      setItemToPurge(undefined)
      await refetchAllOpenedFolders()
    },
  })

  const onConfirm = () => {
    if (!projectRef || !selectedBucket?.id || itemToPurge === undefined) return

    // The delete endpoint addresses an object by its full path in the bucket, and a
    // row only knows its own leaf name.
    const folderPath = getPathAlongOpenedFolders(
      { openedFolders: openedFolders.slice(0, itemToPurge.columnIndex), selectedBucket },
      false
    )
    const path = [folderPath, itemToPurge.name].filter(Boolean).join('/')

    purgeObject({ projectRef, bucketId: selectedBucket.id, path })
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
        description:
          'Deletes the file and every version of it, bypassing versioning. Nothing is left to restore.',
      }}
    />
  )
}
