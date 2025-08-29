import { useTransition } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { STORAGE_ROW_TYPES } from '../Storage.constants'

export interface ConfirmDeleteModalProps {
  onClose?: () => void
}

export const ConfirmDeleteModal = ({ onClose }: ConfirmDeleteModalProps) => {
  const { selectedItemsToDelete, deleteFolder, deleteFiles, setSelectedItemsToDelete } =
    useStorageExplorerStateSnapshot()
  const [isDeleting, startTransition] = useTransition()

  const handleClose = () => {
    setSelectedItemsToDelete([])
    onClose?.()
  }

  const onDeleteSelectedFiles = () => {
    startTransition(async () => {
      if (selectedItemsToDelete.length === 1) {
        const [itemToDelete] = selectedItemsToDelete
        if (!itemToDelete) return

        if (itemToDelete.type === STORAGE_ROW_TYPES.FOLDER) {
          await deleteFolder(itemToDelete)
        } else if (itemToDelete.type === STORAGE_ROW_TYPES.FILE) {
          await deleteFiles({ files: [itemToDelete] })
        }
      } else {
        await deleteFiles({ files: selectedItemsToDelete })
      }
      onClose?.()
    })
  }

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

  return (
    <Dialog
      open={selectedItemsToDelete.length > 0}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="break-words">{title}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Admonition
            type="destructive"
            title="This action cannot be undone"
            description={description}
          />
        </DialogSection>
        <DialogFooter>
          <Button type="default" onClick={handleClose} loading={isDeleting}>
            Cancel
          </Button>
          <Button type="danger" onClick={onDeleteSelectedFiles} loading={isDeleting}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDeleteModal
