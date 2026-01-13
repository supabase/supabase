import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Trash2 } from 'lucide-react'

import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import type { APIKeysData } from 'data/api-keys/api-keys-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface APIKeyDeleteDialogProps {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  setKeyToDelete: (id: string | null) => void
}

export const APIKeyDeleteDialog = ({ apiKey, setKeyToDelete }: APIKeyDeleteDialogProps) => {
  const { can: canDeleteAPIKeys } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    '*'
  )

  return (
    <DropdownMenuItemTooltip
      className="flex gap-2"
      onClick={() => {
        if (canDeleteAPIKeys) {
          setKeyToDelete(apiKey.id)
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
      <Trash2 size={14} /> Delete API key
    </DropdownMenuItemTooltip>
  )
}
