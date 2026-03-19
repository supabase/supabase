import { useVaultSecretDeleteMutation } from 'data/vault/vault-secret-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Modal } from 'ui'

import { useVaultSecretsQuery } from '@/data/vault/vault-secrets-query'

export const DeleteSecretModal = () => {
  const { data: project } = useSelectedProjectQuery()

  const { data: secrets = [], isSuccess } = useVaultSecretsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [secretIdToDelete, setSelectedSecretToDelete] = useQueryState('delete', parseAsString)
  const selectedSecret = secrets.find((secret) => secret.id === secretIdToDelete)

  const {
    mutate: deleteSecret,
    isPending: isDeleting,
    isSuccess: isSuccessDelete,
  } = useVaultSecretDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted secret ${selectedSecret?.name}`)
      setSelectedSecretToDelete(null)
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

  useEffect(() => {
    if (isSuccess && !!secretIdToDelete && !selectedSecret && !isSuccessDelete) {
      toast('Secret not found')
      setSelectedSecretToDelete(null)
    }
  }, [isSuccess, isSuccessDelete, secretIdToDelete, selectedSecret, setSelectedSecretToDelete])

  return (
    <Modal
      size="small"
      variant="danger"
      alignFooter="right"
      header="Confirm to delete secret"
      visible={!!selectedSecret}
      loading={isDeleting}
      onCancel={() => setSelectedSecretToDelete(null)}
      onConfirm={onConfirmDeleteSecret}
    >
      <Modal.Content className="space-y-4">
        <p className="text-sm">
          The following secret will be permanently removed and cannot be recovered. Are you sure?
        </p>
        <div className="space-y-1">
          <p className="text-sm">{selectedSecret?.description}</p>
          <p className="text-sm text-foreground-light">
            ID: <span className="font-mono">{selectedSecret?.id}</span>
          </p>
        </div>
      </Modal.Content>
    </Modal>
  )
}
