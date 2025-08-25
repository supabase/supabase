import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { Check, Key, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import CopyButton from 'components/ui/CopyButton'
import { useClientSecretDeleteMutation } from 'data/oauth-secrets/client-secret-delete-mutation'
import { Secret, useClientSecretsQuery } from 'data/oauth-secrets/client-secrets-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export interface SecretRowProps {
  secret: Secret
  appId?: string
}

export const SecretRow = ({ secret, appId }: SecretRowProps) => {
  const { slug } = useParams()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const canManageSecrets = useCheckPermissions(PermissionAction.UPDATE, 'oauth_apps')

  const { data } = useClientSecretsQuery({ slug, appId })
  const secrets = data?.client_secrets ?? []
  const isLast = secrets.length === 1

  const { data: members = [] } = useOrganizationMembersQuery({ slug })
  const generatedBy = members.find((x) => x.gotrue_id === secret.created_by)
  const generatedByName = generatedBy?.username ?? generatedBy?.primary_email ?? secret.created_by

  const { mutate: deleteSecret, isLoading: isDeleting } = useClientSecretDeleteMutation({
    onSuccess: () => {
      // Show success toast and close modal after successful deletion
      toast.success('Successfully deleted client secret')
      setShowDeleteModal(false)
    },
  })

  const handleDelete = () => {
    if (!slug) return console.error('Slug is required')
    if (!appId) return console.error('App ID is required')
    deleteSecret({ slug, appId, secretId: secret.id })
  }

  const isNew = secret.client_secret !== undefined

  return (
    <>
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
                Added {isNew ? 'now' : dayjs(secret.created_at).fromNow()} by {generatedByName}
              </p>
              {secret.last_used_at && (
                <p className="text-sm text-foreground-lighter">
                  Last used {dayjs(secret.last_used_at).fromNow()}
                </p>
              )}
              {!secret.last_used_at && !isNew && (
                <p className="text-sm text-foreground-lighter">Never used</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ButtonTooltip
            type="default"
            className="w-7"
            icon={<Trash />}
            disabled={!appId || !canManageSecrets || isLast}
            onClick={() => setShowDeleteModal(true)}
            tooltip={{
              content: {
                className: 'w-64 text-center',
                side: 'bottom',
                text: !canManageSecrets
                  ? 'You need additional permissions to delete client secrets'
                  : isLast
                    ? 'You must have at least one client secret for the OAuth application to function.'
                    : undefined,
              },
            }}
          />
        </div>
      </div>

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
          title: 'This action cannot be undone',
          description: 'The client secret will be permanently removed and cannot be recovered.',
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
