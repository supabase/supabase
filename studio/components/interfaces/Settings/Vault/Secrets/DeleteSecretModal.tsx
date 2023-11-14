import { useState } from 'react'
import { Modal } from 'ui'

import { useStore } from 'hooks'
import { VaultSecret } from 'types'

interface DeleteSecretModalProps {
  selectedSecret: VaultSecret
  onClose: () => void
}

const DeleteSecretModal = ({ selectedSecret, onClose }: DeleteSecretModalProps) => {
  const { vault, ui } = useStore()

  const [isDeleting, setIsDeleting] = useState(false)

  const onConfirmDeleteSecret = async () => {
    setIsDeleting(true)
    const res = await vault.deleteSecret(selectedSecret.id)
    if (res.error) {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to delete secret: ${res.error.message}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: `Successfully deleted secret ${selectedSecret.name}`,
      })
      onClose()
    }
    setIsDeleting(false)
  }

  return (
    <Modal
      closable
      size="small"
      alignFooter="right"
      visible={selectedSecret !== undefined}
      onCancel={onClose}
      onConfirm={onConfirmDeleteSecret}
      loading={isDeleting}
      header={<h5 className="text-sm text-foreground">Confirm to delete secret</h5>}
    >
      <div className="py-4">
        <Modal.Content>
          <div className="space-y-4">
            <p className="text-sm">
              The following secret will be permanently removed and cannot be recovered. Are you
              sure?
            </p>
            <div className="space-y-1">
              <p className="text-sm">{selectedSecret?.description}</p>
              <p className="text-sm text-foreground-light">
                ID: <span className="font-mono">{selectedSecret?.key_id}</span>
              </p>
            </div>
          </div>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default DeleteSecretModal
