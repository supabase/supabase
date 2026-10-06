import { Trash2 } from 'lucide-react'

import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import type { APIKeysData } from '@/data/api-keys/api-keys-query'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

interface APIKeyDeleteDialogProps {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  setKeyToDelete: (id: string | null) => void
}

export const APIKeyDeleteDialog = ({ apiKey, setKeyToDelete }: APIKeyDeleteDialogProps) => {
  const { can: canDeleteAPIKeys } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_WRITE
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
