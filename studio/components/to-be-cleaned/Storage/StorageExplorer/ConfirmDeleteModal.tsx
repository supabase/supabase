import { noop } from 'lodash'
import { useEffect, useState } from 'react'
import { Alert, Button, Modal } from 'ui'

interface ConfirmDeleteModalProps {
  visible: boolean
  selectedItemsToDelete: any[]
  onSelectCancel: () => void
  onSelectDelete: () => void
}

const ConfirmDeleteModal = ({
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
    <Modal
      visible={visible}
      header={<span className="break-words">{title}</span>}
      size="medium"
      onCancel={onSelectCancel}
      customFooter={
        <div className="flex items-center gap-2">
          <Button type="default" disabled={deleting} onClick={onSelectCancel}>
            Cancel
          </Button>
          <Button type="danger" disabled={deleting} loading={deleting} onClick={onConfirmDelete}>
            {deleting ? 'Deleting' : 'Delete'}
          </Button>
        </div>
      }
    >
      <Modal.Content>
        <div className="my-4">
          <Alert withIcon variant="danger" title={`This action cannot be undone.`}>
            {description}
          </Alert>
        </div>
      </Modal.Content>
    </Modal>
  )
}

export default ConfirmDeleteModal
