import { useParams } from 'common'
import { Trash2Icon } from 'lucide-react'

import { getWriteGrantTooltip } from './APIKeys.utils'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import type { APIKeysData } from '@/data/api-keys/api-keys-query'
import { useGrant } from '@/lib/grants'

interface APIKeyDeleteDialogProps {
  apiKey: Extract<APIKeysData[number], { type: 'secret' | 'publishable' }>
  setKeyToDelete: (id: string | null) => void
}

export const APIKeyDeleteDialog = ({ apiKey, setKeyToDelete }: APIKeyDeleteDialogProps) => {
  const { ref: projectRef } = useParams()
  const deleteGrant = useGrant('DELETE /v1/projects/{ref}/api-keys/{id}', { projectRef })
  const canDeleteAPIKeys = deleteGrant.status === 'granted'

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
          text: getWriteGrantTooltip(deleteGrant.status, 'delete'),
        },
      }}
    >
      <Trash2Icon size={14} /> Delete API key
    </DropdownMenuItemTooltip>
  )
}
