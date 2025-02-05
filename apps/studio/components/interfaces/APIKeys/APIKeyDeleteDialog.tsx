import { useState } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common/hooks'
import { useAPIKeyDeleteMutation } from 'data/api-keys/api-key-delete-mutation'
import { APIKeysData } from 'data/api-keys/api-keys-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DropdownMenuItem } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

interface APIKeyDeleteDialogProps {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
}

export const APIKeyDeleteDialog = ({ apiKey }: APIKeyDeleteDialogProps) => {
  const { ref: projectRef } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const canDeleteAPIKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, '*')

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
      <DropdownMenuItem
        className="flex gap-2 !pointer-events-auto"
        onClick={async (e) => {
          if (canDeleteAPIKeys) {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
      >
        Delete API key
      </DropdownMenuItem>
      <TextConfirmModal
        visible={isOpen}
        onCancel={() => setIsOpen(false)}
        onConfirm={onDeleteAPIKey}
        title={`Delete ${apiKey.description ?? ''} API secret key`}
        confirmString={apiKey.description || 'Delete API secret key'}
        confirmLabel="Delete API secret key"
        confirmPlaceholder="Type API key description to confirm"
        loading={isDeletingAPIKey}
        variant="destructive"
        alert={{
          title: 'This cannot be undone',
          description:
            'Deleting this API key will invalidate it immediately. Any applications using this key will no longer be able to access this project.',
        }}
      />
    </>
  )
}
