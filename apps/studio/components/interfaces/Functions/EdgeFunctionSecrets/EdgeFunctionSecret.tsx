import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Edit2, MoreVertical, Trash } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { ProjectSecret } from '@/data/secrets/secrets-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface EdgeFunctionSecretProps {
  secret: ProjectSecret
  onSelectDelete: () => void
  onSelectEdit: () => void
}

const EdgeFunctionSecret = ({ secret, onSelectEdit, onSelectDelete }: EdgeFunctionSecretProps) => {
  const { can: canUpdateSecrets } = useAsyncCheckPermissions(PermissionAction.SECRETS_WRITE, '*')

  return (
    <TableRow>
      <TableCell>
        <Tooltip>
          <TooltipTrigger
            onClick={() => {
              copyToClipboard(secret.name)
              toast.success(`Copied ${secret.name}`)
            }}
          >
            <p className="truncate py-1">
              <code className="text-code-inline">{secret.name}</code>
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom">Click to copy</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <p className="max-w-96 truncate" title={secret.value}>
          <code className="text-code-inline !text-foreground-light">{secret.value}</code>
        </p>
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
                  disabled={!canUpdateSecrets}
                  onClick={() => onSelectEdit()}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !canUpdateSecrets
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
                  disabled={!canUpdateSecrets}
                  onClick={() => onSelectDelete()}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: !canUpdateSecrets
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
