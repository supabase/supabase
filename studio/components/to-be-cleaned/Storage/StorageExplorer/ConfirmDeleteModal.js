import { useEffect, useState } from 'react'
import { Modal, Button, Space } from '@supabase/ui'

const ConfirmDeleteModal = ({
  visible = false,
  selectedItemsToDelete = [],
  onSelectCancel = () => {},
  onSelectDelete = () => {},
}) => {
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setDeleting(false)
  }, [visible])

  const multipleFiles = selectedItemsToDelete.length > 1

  const title = multipleFiles
    ? `Confirm deletion of items`
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
    <Modal
      visible={visible}
      title={title}
      description={`${description} This action cannot be undone.`}
      size="small"
      customFooter={
        <Space>
          <Button type="secondary" onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="primary" danger loading={deleting} onClick={onConfirmDelete}>
            {deleting ? 'Deleting' : 'Delete'}
          </Button>
        </Space>
      }
    />
  )
}

export default ConfirmDeleteModal
