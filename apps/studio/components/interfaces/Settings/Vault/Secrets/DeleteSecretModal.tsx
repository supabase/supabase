import toast from 'react-hot-toast'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretDeleteMutation } from 'data/vault/vault-secret-delete-mutation'
import type { VaultSecret } from 'types'
import { Modal } from 'ui'

interface DeleteSecretModalProps {
  selectedSecret: VaultSecret | undefined
  onClose: () => void
}

const DeleteSecretModal = ({ selectedSecret, onClose }: DeleteSecretModalProps) => {
  const { project } = useProjectContext()
  const { mutate: deleteSecret, isLoading: isDeleting } = useVaultSecretDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted secret ${selectedSecret?.name}`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to delete secret: ${error.message}`)
    },
  })

  const onConfirmDeleteSecret = async () => {
    if (!project) return console.error('Project is required')
    if (!selectedSecret) return

    deleteSecret({
      projectRef: project.ref,
      connectionString: project?.connectionString,
      id: selectedSecret.id,
    })
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
