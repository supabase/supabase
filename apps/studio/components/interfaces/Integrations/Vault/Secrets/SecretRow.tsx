import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Edit3, Eye, EyeOff, Key, Loader, MoreVertical, Trash } from 'lucide-react'
import type { VaultSecret } from 'types'
import { Input } from 'ui-patterns/DataInputs/Input'
import EditSecretModal from './EditSecretModal'
import type { SecretTableColumn } from './Secrets.utils'

interface SecretRowProps {
  row: VaultSecret
  col: SecretTableColumn
  onSelectRemove: (secret: VaultSecret) => void
}

const SecretRow = ({ row, col, onSelectRemove }: SecretRowProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [modal, setModal] = useState<string | null>(null)
  const [revealSecret, setRevealSecret] = useState(false)
  const name = row?.name ?? 'No name provided'

  const { can: canManageSecrets } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const { data: revealedValue, isFetching } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: ref!,
      connectionString: project?.connectionString,
      id: row.id,
    },
    {
      enabled: !!(ref! && row.id) && revealSecret,
    }
  )

  const onCloseModal = () => setModal(null)

  if (col.id === 'actions') {
    return (
      <div className="flex items-center justify-end w-full" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button title="Manage Secret" type="text" className="px-1" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-40">
            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canManageSecrets}
              onClick={() => setModal(`edit`)}
              tooltip={{
                content: { side: 'left', text: 'You need additional permissions to edit secrets' },
              }}
            >
              <Edit3 size={12} />
              <p>Edit</p>
            </DropdownMenuItemTooltip>

            <DropdownMenuSeparator />

            <DropdownMenuItemTooltip
              className="gap-x-2"
              disabled={!canManageSecrets}
              onClick={() => onSelectRemove(row)}
              tooltip={{
                content: {
                  side: 'left',
                  text: 'You need additional permissions to delete secrets',
                },
              }}
            >
              <Trash size={12} />
              <p className="text-foreground-light">Delete</p>
            </DropdownMenuItemTooltip>
          </DropdownMenuContent>
        </DropdownMenu>

        <EditSecretModal visible={modal === `edit`} secret={row} onClose={onCloseModal} />
      </div>
    )
  }

  if (col.id === 'secret_value') {
    return (
      <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
        <Button
          type="text"
          className="px-1.5"
          icon={
            isFetching && revealedValue === undefined ? (
              <Loader className="animate-spin" size={16} strokeWidth={1.5} />
            ) : !revealSecret ? (
              <Eye size={16} strokeWidth={1.5} />
            ) : (
              <EyeOff size={16} strokeWidth={1.5} />
            )
          }
          onClick={() => setRevealSecret(!revealSecret)}
        />
        <div className="flex-grow min-w-0">
          {revealSecret && revealedValue !== undefined ? (
            <Input copy readOnly size="tiny" className="font-mono" value={revealedValue} />
          ) : (
            <p className="text-sm font-mono text-foreground">••••••••••••••••••</p>
          )}
        </div>
      </div>
    )
  }

  if (col.id === 'updated_at') {
    return (
      <div className="w-full flex items-center justify-start">
        <p className="text-xs text-foreground-light">
          {row.updated_at === row.created_at ? 'Added' : 'Updated'} on{' '}
          {dayjs(row.updated_at).format('MMM D, YYYY')}
        </p>
      </div>
    )
  }

  if (col.id === 'id') {
    return (
      <div className="w-full flex items-center">
        <Key size={12} strokeWidth={2} className="text-foreground-light mr-2" />
        <p className="text-foreground-light text-xs font-mono truncate" title={row.id}>
          {row.id}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col justify-center">
      <p className="text-xs text-foreground truncate" title={name}>
        {name}
      </p>
      {row.description !== undefined && row.description !== '' && (
        <div>
          <p className="text-xs text-foreground-lighter w-full truncate">{row.description}</p>
        </div>
      )}
    </div>
  )
}

export default SecretRow
