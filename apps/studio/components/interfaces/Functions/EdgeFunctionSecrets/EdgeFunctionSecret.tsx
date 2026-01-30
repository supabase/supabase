import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Edit2, Eye, EyeOff, MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import type { ProjectSecret } from 'data/secrets/secrets-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

interface EdgeFunctionSecretProps {
  secret: ProjectSecret
  onSelectDelete: () => void
  onSelectEdit: () => void
}

const EdgeFunctionSecret = ({ secret, onSelectEdit, onSelectDelete }: EdgeFunctionSecretProps) => {
  const { can: canUpdateSecrets } = useAsyncCheckPermissions(PermissionAction.SECRETS_WRITE, '*')
  const [isValueVisible, setIsValueVisible] = useState(false)
  
  // [Joshen] Following API's validation:
  // https://github.com/supabase/platform/blob/develop/api/src/routes/v1/projects/ref/secrets/secrets.controller.ts#L106
  const isReservedSecret = !!secret.name.match(/^(SUPABASE_).*/)

  const displayValue = isValueVisible ? secret.value : '•'.repeat(Math.min(secret.value.length, 20))
  return (
    <TableRow>
      <TableCell>
        <p className="truncate py-2">{secret.name}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <p
            className="font-mono text-sm max-w-96 truncate text-foreground-light"
            title={isValueVisible ? secret.value : 'Hidden'}
          >
            {displayValue}
          </p>
          <Button
            type="default"
            size="tiny"
            title={isValueVisible ? 'Hide secret value' : 'Show secret value'}
            aria-label={isValueVisible ? 'Hide secret value' : 'Show secret value'}
            className="px-1.5"
            icon={isValueVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            onClick={() => setIsValueVisible((prev) => !prev)}
          />
        </div>
      </TableCell>
      <TableCell>
        {!!secret.updated_at ? (
          <TimestampInfo
            displayAs="utc"
            utcTimestamp={secret.updated_at}
            labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
            className="!text-sm text-foreground-light whitespace-nowrap"
          />
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More options"
                type="default"
                className="px-1"
                icon={<MoreVertical />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-52">
              <DropdownMenuItem asChild>
                <ButtonTooltip
                  type="text"
                  icon={<Edit2 size={14} />}
                  className="w-full justify-start group text-inherit"
                  disabled={!canUpdateSecrets || isReservedSecret}
                  onClick={() => onSelectEdit()}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: isReservedSecret
                        ? 'This is a reserved secret and cannot be changed'
                        : !canUpdateSecrets
                          ? 'You need additional permissions to edit edge function secrets'
                          : undefined,
                    },
                  }}
                >
                  Edit secret
                </ButtonTooltip>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <ButtonTooltip
                  type="text"
                  icon={<Trash size={14} className="group-[&:not(:disabled)]:text-destructive" />}
                  className="w-full justify-start group text-inherit"
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
                >
                  Delete secret
                </ButtonTooltip>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default EdgeFunctionSecret
