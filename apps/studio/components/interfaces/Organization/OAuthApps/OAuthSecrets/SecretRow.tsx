import dayjs from 'dayjs'
import { Check, Key } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common/hooks'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import { useClientSecretDeleteMutation } from 'data/oauth-secrets/client-secret-delete-mutation'
import { useClientSecretsQuery } from 'data/oauth-secrets/client-secrets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { SecretRowProps } from './OAuthSecrets.types'

/**
 * SecretRow component displays a single client secret with its metadata and delete functionality.
 * It includes a confirmation modal for deletion and shows special warnings if it's the last secret.
 */
const SecretRow = ({ secret, appId }: SecretRowProps) => {
  // Get the current organization slug from URL params
  const { slug } = useParams()
  // State to control the visibility of the delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const canManageSecrets = useCheckPermissions(PermissionAction.UPDATE, 'oauth_apps')

  // We need to fetch all secrets to determine if this is the last one
  // This helps us show appropriate warnings in the delete modal
  const { data } = useClientSecretsQuery({ slug, appId })
  const secrets = data?.client_secrets ?? []
  const isLast = secrets.length === 1

  // Mutation hook for deleting a client secret
  const { mutate: deleteSecret, isLoading: isDeleting } = useClientSecretDeleteMutation({
    onSuccess: () => {
      // Show success toast and close modal after successful deletion
      toast.success('Successfully deleted client secret')
      setShowDeleteModal(false)
    },
  })

  // Handler for the delete action
  const handleDelete = () => {
    if (!appId) return
    deleteSecret({ slug, appId, secretId: secret.id })
  }

  console.log(secret)

  const isNew = secret.client_secret !== undefined

  return (
    <>
      {/* Main row displaying the secret information */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border first:rounded-t last:rounded-b',
          isNew && 'bg-background-alternative'
        )}
      >
        <div className="flex flex-row gap-6 items-center">
          <Key size={16} strokeWidth={2} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {isNew && <Check size={14} className="text-brand" strokeWidth={3} />}
                <p className="font-mono text-sm">
                  {isNew ? secret.client_secret : `${secret.client_secret_alias}${'*'.repeat(36)}`}
                </p>
                {isNew && secret.client_secret && (
                  <CopyButton text={secret.client_secret} type="default" iconOnly />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-0">
              <p className="text-sm text-foreground-lighter">
                Added {isNew ? 'now' : dayjs(secret.created_at).fromNow()}
              </p>
              <p className="text-sm text-foreground-lighter">Added by {secret.created_by}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ButtonTooltip
            type="default"
            disabled={!appId || !canManageSecrets}
            onClick={() => setShowDeleteModal(true)}
            tooltip={{
              content: {
                text: !canManageSecrets
                  ? 'You need additional permissions to delete client secrets'
                  : undefined,
              },
            }}
          >
            Delete
          </ButtonTooltip>
        </div>
      </div>

      {/* Confirmation modal for delete action */}
      <ConfirmationModal
        visible={showDeleteModal}
        variant="destructive"
        title="Confirm to delete client secret"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        loading={isDeleting}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        disabled={isLast}
        alert={{
          title: isLast ? 'Cannot delete the last client secret' : 'This action cannot be undone',
          description: isLast
            ? 'You must have at least one client secret for the OAuth application to function.'
            : 'The client secret will be permanently removed and cannot be recovered.',
        }}
      >
        <p className="text-sm text-foreground-light">
          {isLast
            ? 'The last client secret cannot be deleted. Please generate a new secret before deleting this one.'
            : 'Are you sure you want to delete this client secret?'}
        </p>
      </ConfirmationModal>
    </>
  )
}

export default SecretRow
