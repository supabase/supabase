import { useState } from 'react'
import { toast } from 'sonner'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretDeleteMutation } from 'data/vault/vault-secret-delete-mutation'
import type { VaultSecret } from 'types'
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

interface DeleteSecretModalProps {
  secret: VaultSecret | undefined
  onClose: () => void
}

const DeleteSecretModal = ({ secret, onClose }: DeleteSecretModalProps) => {
  const { project } = useProjectContext()
  const { mutate: deleteSecret, isLoading } = useVaultSecretDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted secret ${secret?.name}`)
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to delete secret: ${error.message}`)
    },
  })

  const onConfirmDeleteSecret = () => {
    if (!project) return console.error('Project is required')
    if (!secret) return

    deleteSecret({
      projectRef: project.ref,
      connectionString: project?.connectionString,
      id: secret.id,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm to delete secret</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4">
          <p className="text-sm">
            The following secret will be permanently removed and cannot be recovered. Are you sure?
          </p>
          <div className="space-y-1">
            <p className="text-sm">{secret?.description}</p>
            <p className="text-sm text-foreground-light">
              ID: <span className="font-mono">{secret?.id}</span>
            </p>
          </div>
        </DialogSection>
        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={onClose}>
            Cancel
          </Button>
          <Button htmlType="submit" loading={isLoading} onClick={onConfirmDeleteSecret}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteSecretModal
