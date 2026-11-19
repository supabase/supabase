import { useEffect, useState } from 'react'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { STORAGE_ROW_TYPES } from '../Storage.constants'
import { getBucketVersioningState, isVersioningActive } from '../StorageVersioning.constants'
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
  // Only an enabled bucket soft-deletes. A suspended bucket still writes a delete marker,
  // but the content deleted, so it reads as a plain delete.
  const canArchive = isStorageVersioningEnabled && isVersioningActive(selectedBucket)
  const isSuspended =
    isStorageVersioningEnabled && getBucketVersioningState(selectedBucket) === 'suspended'

  const visible = selectedItemsToDelete.length > 0
  const multipleFiles = selectedItemsToDelete.length > 1
  const [firstItem] = selectedItemsToDelete

  const getTitle = () => {
    if (multipleFiles) {
      const verb = canArchive ? 'Archive' : 'Delete'
      return `${verb} ${selectedItemsToDelete.length} items?`
    }
    if (firstItem === undefined) return ''
    return canArchive ? `Archive ${firstItem.name}?` : `Delete ${firstItem.name}?`
  }

  const getSubject = () => {
    if (multipleFiles) return `the selected ${selectedItemsToDelete.length} items`
    if (firstItem === undefined) return 'the selected item'
    return `the selected ${firstItem.type.toLowerCase()}`
  }

  const getAlert = () => {
    if (canArchive) {
      return {
        base: { variant: 'warning' as const },
        title: 'Versions are retained',
        description: `Archiving ${getSubject()} hides it from the bucket. Its noncurrent versions stay retained until you delete them individually or a lifecycle policy expires them.`,
      }
    }
    if (isSuspended) {
      return {
        base: { variant: 'destructive' as const },
        title: 'Only retained versions survive',
        description: `Versioning is suspended, so deleting ${getSubject()} permanently removes its current content. Versions retained from before stay under Show archived until you delete them or a lifecycle policy expires them.`,
      }
    }
    return {
      base: { variant: 'destructive' as const },
      title: 'This action cannot be undone',
      description: `Are you sure you want to delete ${getSubject()}?`,
    }
  }

  const alert = getAlert()

  const onDeleteSelectedFiles = async () => {
    try {
      setDeleting(true)
      if (
        selectedItemsToDelete.length === 1 &&
        selectedItemsToDelete[0].type === STORAGE_ROW_TYPES.FOLDER
      ) {
        await deleteFolder(selectedItemsToDelete[0], { isArchive: canArchive })
      } else {
        await deleteFiles({ files: selectedItemsToDelete, isArchive: canArchive })
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
      confirmLabel={canArchive ? 'Archive' : 'Delete'}
      loading={deleting}
      onCancel={() => setSelectedItemsToDelete([])}
      onConfirm={onDeleteSelectedFiles}
      variant={canArchive ? 'warning' : 'destructive'}
      alert={alert}
    />
  )
}
