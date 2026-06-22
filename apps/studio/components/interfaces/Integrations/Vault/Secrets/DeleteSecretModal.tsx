import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { useVaultSecretDeleteMutation } from '@/data/vault/vault-secret-delete-mutation'
import { useVaultSecretsQuery } from '@/data/vault/vault-secrets-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const DeleteSecretModal = () => {
  const { data: project } = useSelectedProjectQuery()

  const { data: secrets = [], isSuccess } = useVaultSecretsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [secretIdToDelete, setSelectedSecretToDelete] = useQueryState('delete', parseAsString)
  const selectedSecret = secrets.find((secret) => secret.id === secretIdToDelete)

  const { mutateAsync: deleteSecret, isSuccess: isSuccessDelete } = useVaultSecretDeleteMutation({
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
    <AlertDialog open={!!selectedSecret} onOpenChange={() => setSelectedSecretToDelete(null)}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm to delete secret</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="text-sm">
              The following secret will be permanently removed and cannot be recovered. Are you
              sure?
            </p>
            <div className="space-y-1">
              <p className="text-sm">{selectedSecret?.description}</p>
              <p className="text-sm text-foreground-light">
                ID: <code className="text-code-inline">{selectedSecret?.id}</code>
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirmDeleteSecret}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
