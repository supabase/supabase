import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Trash } from 'lucide-react'

import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { ProjectSecret } from 'data/secrets/secrets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface EdgeFunctionSecretProps {
  secret: ProjectSecret
  onSelectDelete: () => void
}

const EdgeFunctionSecret = ({ secret, onSelectDelete }: EdgeFunctionSecretProps) => {
  const canUpdateSecrets = useCheckPermissions(PermissionAction.FUNCTIONS_WRITE, '*')
  return (
    <Table.tr>
      <Table.td>
        <p className="truncate py-2">{secret.name}</p>
      </Table.td>
      <Table.td>
        <div className="flex items-center space-x-2">
          <p className="font-mono text-sm truncate" title={secret.value}>
            {secret.value}
          </p>
        </div>
      </Table.td>
      <Table.td>
        <div className="flex items-center justify-end">
          <ButtonTooltip
            type="text"
            icon={<Trash />}
            className="px-1"
            disabled={!canUpdateSecrets}
            onClick={() => onSelectDelete()}
            tooltip={{
              content: {
                side: 'bottom',
                text: 'You need additional permissions to delete edge function secrets',
              },
            }}
          />
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default EdgeFunctionSecret
