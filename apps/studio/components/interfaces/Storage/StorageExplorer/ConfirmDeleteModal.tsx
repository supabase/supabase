import { noop } from 'lodash'
import { useEffect, useState } from 'react'

import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { StorageItem } from '../Storage.types'

interface ConfirmDeleteModalProps {
  visible: boolean
  selectedItemsToDelete: StorageItem[]
  onSelectCancel: () => void
  onSelectDelete: () => void
}

export const ConfirmDeleteModal = ({
  visible = false,
  selectedItemsToDelete = [],
  onSelectCancel = noop,
  onSelectDelete = noop,
}: ConfirmDeleteModalProps) => {
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setDeleting(false)
  }, [visible])

  const multipleFiles = selectedItemsToDelete.length > 1

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

  const onConfirmDelete = () => {
    setDeleting(true)
    onSelectDelete()
  }

  return (
    <ConfirmationModal
      visible={visible}
      title={<span className="break-words">{title}</span>}
      size="medium"
      onCancel={onSelectCancel}
      onConfirm={onConfirmDelete}
      variant="destructive"
      alert={{
        base: { variant: 'destructive' },
        title: 'This action cannot be undone',
        description,
      }}
    />
  )
}

export default ConfirmDeleteModal
