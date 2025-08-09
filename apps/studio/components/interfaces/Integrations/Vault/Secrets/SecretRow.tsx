import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useVaultSecretDecryptedValueQuery } from 'data/vault/vault-secret-decrypted-value-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Edit3, Eye, EyeOff, Key, Loader, MoreVertical, Trash } from 'lucide-react'
import type { VaultSecret } from 'types'
import EditSecretModal from './EditSecretModal'

interface SecretRowProps {
  secret: VaultSecret
  onSelectRemove: (secret: VaultSecret) => void
}

const SecretRow = ({ secret, onSelectRemove }: SecretRowProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [modal, setModal] = useState<string | null>(null)
  const [revealSecret, setRevealSecret] = useState(false)
  const name = secret?.name ?? 'No name provided'

  const canManageSecrets = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  const { data: revealedValue, isFetching } = useVaultSecretDecryptedValueQuery(
    {
      projectRef: ref!,
      connectionString: project?.connectionString,
      id: secret.id,
    },
    {
      enabled: !!(ref! && secret.id) && revealSecret,
    }
  )

  const onCloseModal = () => setModal(null)

  return (
    <div className="px-6 py-4 flex items-center space-x-4">
      <div className="space-y-1 min-w-[35%] max-w-[35%]">
        <div>
          <p className="text-sm text-foreground" title={name}>
            {name}
          </p>
          {secret.description !== undefined && (
            <p className="text-sm text-foreground-light" title={secret.description}>
              {secret.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 group">
          <Key size={14} strokeWidth={2} className="text-foreground-light transition" />
          <p className="text-foreground-light font-mono text-xs transition" title={secret.id}>
            {secret.id}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 w-[40%]">
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
        <div className="flex-grow">
          {revealSecret && revealedValue ? (
            <Input copy size="small" className="font-mono" value={revealedValue} />
          ) : (
            <p className="text-sm font-mono">••••••••••••••••••</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end w-[25%] space-x-4">
        <p className="text-sm text-foreground-light">
          {secret.updated_at === secret.created_at ? 'Added' : 'Updated'} on{' '}
          {dayjs(secret.updated_at).format('MMM D, YYYY')}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button title="Manage Secret" type="text" className="px-1" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-32">
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  className="space-x-2"
                  disabled={!canManageSecrets}
                  onClick={() => setModal(`edit`)}
                >
                  <Edit3 size="14" />
                  <p>Edit</p>
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canManageSecrets && (
                <TooltipContent side="bottom">
                  You need additional permissions to edit secrets
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  className="space-x-2"
                  disabled={!canManageSecrets}
                  onClick={() => onSelectRemove(secret)}
                >
                  <Trash stroke="red" size="14" />
                  <p className="text-foreground-light">Delete</p>
                </DropdownMenuItem>
              </TooltipTrigger>
              {!canManageSecrets && (
                <TooltipContent side="bottom">
                  You need additional permissions to delete secrets
                </TooltipContent>
              )}
            </Tooltip>
          </DropdownMenuContent>
        </DropdownMenu>

        <EditSecretModal visible={modal === `edit`} secret={secret} onClose={onCloseModal} />
      </div>
    </div>
  )
}

export default SecretRow
