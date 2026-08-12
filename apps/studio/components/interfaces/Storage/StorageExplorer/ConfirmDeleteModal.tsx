import { useEffect, useState } from 'react'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { hasVersioningHistory } from '../StorageProtection.constants'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const ConfirmDeleteModal = () => {
  const [deleting, setDeleting] = useState(false)
  const {
    selectedItemsToDelete,
    deleteFolder,
    deleteFiles,
    setSelectedItemsToDelete,
    selectedBucket,
  } = useStorageExplorerStateSnapshot()

  const visible = selectedItemsToDelete.length > 0
  const multipleFiles = selectedItemsToDelete.length > 1
  const isSingleFile =
    selectedItemsToDelete.length === 1 &&
    selectedItemsToDelete[0].type !== STORAGE_ROW_TYPES.FOLDER

  const title = multipleFiles
    ? `Confirm deletion of ${selectedItemsToDelete.length} items`
    : selectedItemsToDelete.length === 1
      ? `Confirm deletion of ${selectedItemsToDelete[0].name}`
      : ``

  const description = multipleFiles
    ? `Are you sure you want to delete the selected ${selectedItemsToDelete.length} items?`
    : selectedItemsToDelete.length === 1
      ? `Are you sure you want to delete the selected ${selectedItemsToDelete[0].type.toLowerCase()}?`
      : ``

  // A single file delete on a bucket that's ever had versioning enabled is a
  // soft-delete, not a permanent one — this used to be a permanent 3-line
  // explainer taking up space in the file preview panel; it only needs to
  // surface here, at the moment it's actually relevant.
  const alertDescription =
    isSingleFile && hasVersioningHistory(selectedBucket?.id) ? (
      <>
        {description} This soft-deletes the object and all its versions — you can restore them
        from the deleted versions view.
      </>
    ) : (
      description
    )

  const onDeleteSelectedFiles = async () => {
    try {
      setDeleting(true)
      if (
        selectedItemsToDelete.length === 1 &&
        selectedItemsToDelete[0].type === STORAGE_ROW_TYPES.FOLDER
      ) {
        await deleteFolder(selectedItemsToDelete[0])
      } else {
        await deleteFiles({ files: selectedItemsToDelete })
      }
    } catch (err) {
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    setDeleting(false)
  }, [visible])

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title={<span className="wrap-break-word">{title}</span>}
      loading={deleting}
      onCancel={() => setSelectedItemsToDelete([])}
      onConfirm={onDeleteSelectedFiles}
      variant="destructive"
      alert={{
        base: { variant: 'destructive' },
        title: 'This action cannot be undone',
        description: alertDescription,
      }}
    />
  )
}
