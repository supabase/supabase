import { useEffect, useState } from 'react'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { getBucketVersioningState } from '../StorageVersioning.constants'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const ConfirmDeleteModal = () => {
  const [deleting, setDeleting] = useState(false)
  const {
    selectedBucket,
    selectedItemsToDelete,
    deleteFolder,
    deleteFiles,
    setSelectedItemsToDelete,
  } = useStorageExplorerStateSnapshot()

  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()
  // On a versioned bucket a delete is a soft delete: the object is hidden but
  // every version stays recoverable, so the usual "cannot be undone" warning
  // would be wrong.
  const isVersionedBucket =
    isStorageVersioningEnabled && getBucketVersioningState(selectedBucket) !== 'disabled'

  const visible = selectedItemsToDelete.length > 0
  const multipleFiles = selectedItemsToDelete.length > 1
  const [firstItem] = selectedItemsToDelete

  const getTitle = () => {
    if (multipleFiles) {
      const verb = isVersionedBucket ? 'Archive' : 'Delete'
      return `${verb} ${selectedItemsToDelete.length} items?`
    }
    if (firstItem === undefined) return ''
    return isVersionedBucket ? `Archive ${firstItem.name}?` : `Delete ${firstItem.name}?`
  }

  const getSubject = () => {
    if (multipleFiles) return `the selected ${selectedItemsToDelete.length} items`
    if (firstItem === undefined) return 'the selected item'
    return `the selected ${firstItem.type.toLowerCase()}`
  }

  const alert = isVersionedBucket
    ? {
        base: { variant: 'warning' as const },
        title: 'Versions are kept',
        description: `Archiving ${getSubject()} hides it from the bucket. Its noncurrent versions stay retained until you delete them individually or a lifecycle policy expires them.`,
      }
    : {
        base: { variant: 'destructive' as const },
        title: 'This action cannot be undone',
        description: `Are you sure you want to delete ${getSubject()}?`,
      }

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
      title={<span className="wrap-break-word">{getTitle()}</span>}
      confirmLabel={isVersionedBucket ? 'Archive' : 'Delete'}
      loading={deleting}
      onCancel={() => setSelectedItemsToDelete([])}
      onConfirm={onDeleteSelectedFiles}
      variant={isVersionedBucket ? 'warning' : 'destructive'}
      alert={alert}
    />
  )
}
