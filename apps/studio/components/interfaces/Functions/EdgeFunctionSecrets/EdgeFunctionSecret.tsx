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
  const canUpdateSecrets = useCheckPermissions(PermissionAction.SECRETS_WRITE, '*')
  // [Joshen] Following API's validation:
  // https://github.com/supabase/infrastructure/blob/develop/api/src/routes/v1/projects/ref/secrets/secrets.controller.ts#L106
  const isReservedSecret = !!secret.name.match(/^(SUPABASE_).*/)

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
            disabled={!canUpdateSecrets || isReservedSecret}
            onClick={() => onSelectDelete()}
            tooltip={{
              content: {
                side: 'bottom',
                text: isReservedSecret
                  ? 'This is a reserved secret and cannot be deleted'
                  : !canUpdateSecrets
                    ? 'You need additional permissions to delete edge function secrets'
                    : undefined,
              },
            }}
          />
        </div>
      </Table.td>
    </Table.tr>
  )
}

export default EdgeFunctionSecret
