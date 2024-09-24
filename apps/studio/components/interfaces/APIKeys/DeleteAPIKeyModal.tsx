import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { APIKeysData } from 'data/api-keys/api-keys-query'
import { useDeleteAPIKeyMutation } from 'data/api-keys/delete-api-key-mutation'

export interface DeleteAPIKeyModalProps {
  projectRef: string
  apiKey: APIKeysData[0]
  visible: boolean
  setVisible: (value: boolean) => void
}

const DeleteAPIKeyModal = ({ projectRef, apiKey, visible, setVisible }: DeleteAPIKeyModalProps) => {
  const onClose = (value: boolean) => {
    setVisible(value)
  }

  const { mutate: deleteAPIKey, isLoading: isDeletingAPIKey } = useDeleteAPIKeyMutation()

  const onDelete = () => {
    deleteAPIKey(
      {
        projectRef,
        apiKeyId: apiKey.id!,
      },
      {
        onSuccess: () => {
          onClose(false)
        },
      }
    )
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API key</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          Explain why it's dangerous to delete this, ask user to input API key prefix before the
          delete button becomes active.
        </DialogSection>
        <DialogFooter>
          <Button type="outline" onClick={() => onClose(false)} disabled={isDeletingAPIKey}>
            Cancel
          </Button>
          <Button type="danger" onClick={() => onDelete()} disabled={isDeletingAPIKey}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteAPIKeyModal
