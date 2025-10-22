import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common/hooks'
import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useAPIKeyDeleteMutation } from 'data/api-keys/api-key-delete-mutation'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface APIKeyDeleteDialogProps {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  lastSeen?: { timestamp: string }
}

export const APIKeyDeleteDialog = ({ apiKey, lastSeen }: APIKeyDeleteDialogProps) => {
  const { ref: projectRef } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const { can: canDeleteAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*'
  )

  const { mutate: deleteAPIKey, isLoading: isDeletingAPIKey } = useAPIKeyDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted API key`)
      setIsOpen(false)
    },
  })

  const onDeleteAPIKey = () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteAPIKey({ projectRef, id: apiKey.id })
  }

  return (
    <>
      <DropdownMenuItemTooltip
        className="flex gap-2"
        onClick={async (e) => {
          if (canDeleteAPIKeys) {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        disabled={!canDeleteAPIKeys}
        tooltip={{
          content: {
            side: 'left',
            text: !canDeleteAPIKeys
              ? 'You need additional permissions to delete API keys'
              : undefined,
          },
        }}
      >
        <Trash2 size={14} strokeWidth={1.5} /> Delete API key
      </DropdownMenuItemTooltip>
      <TextConfirmModal
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={onDeleteAPIKey}
        title={`Delete ${apiKey.type} API key: ${apiKey.name}`}
        confirmString={apiKey.name}
        confirmLabel="Yes, irreversibly delete this API key"
        confirmPlaceholder="Type the name of the API key to confirm"
        loading={isDeletingAPIKey}
        variant="destructive"
        alert={{
          title: 'This cannot be undone',
          description: lastSeen
            ? `This API key was used ${lastSeen.timestamp}. Make sure all backend components using it have been updated. Deletion will cause them to receive HTTP 401 Unauthorized status codes on all Supabase APIs.`
            : `This API key has not been used in the past 24 hours. Make sure you've updated all backend components using it before deletion.`,
        }}
      />
    </>
  )
}
