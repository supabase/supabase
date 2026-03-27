import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Code, Edit2, Eye, EyeOff, Lock, MoreVertical, Trash } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
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
  cn,
} from 'ui'

import type { EnvironmentVariable } from './EnvironmentVariables.types'

function getScopeLabel(variable: EnvironmentVariable): string {
  if (variable.category === 'platform') return 'Production'
  if (variable.scope === null) return 'All Environments'
  if (variable.scope === 'production') return 'Production'
  if (variable.scope === 'preview' && !variable.branch) return 'Preview'
  if (variable.scope === 'branch' && variable.branch) return variable.branch.replace(/_/g, '-')
  if (variable.scope === 'development') return 'Development'
  return 'All Environments'
}

interface EnvironmentVariableRowProps {
  variable: EnvironmentVariable
  onSelectEdit: () => void
  onSelectDelete: () => void
}

const EnvironmentVariableRow = ({
  variable,
  onSelectEdit,
  onSelectDelete,
}: EnvironmentVariableRowProps) => {
  const { can: canUpdateSecrets } = useAsyncCheckPermissions(PermissionAction.SECRETS_WRITE, '*')
  const [revealed, setRevealed] = useState(false)
  const isPlatform = variable.category === 'platform'
  const scopeLabel = getScopeLabel(variable)

  const displayValue = variable.isSecret
    ? revealed
      ? variable.value || '(write-only)'
      : '••••••••••••••'
    : variable.value

  return (
    <TableRow>
      {/* Icon */}
      <TableCell className="w-10 pr-0">
        <div className="flex items-center justify-center w-8 h-8 rounded border border-default bg-surface-100">
          {variable.isSecret ? (
            <Lock size={14} className="text-foreground-light" />
          ) : (
            <Code size={14} className="text-foreground-light" />
          )}
        </div>
      </TableCell>

      {/* Name + scope + badges */}
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-sm">{variable.name}</p>
            {variable.isSecret && (
              <Badge variant="default" className="shrink-0">Sensitive</Badge>
            )}
            {variable.hasEnvVar === false && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="destructive" className="shrink-0">No env var</Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  This config value has no backing env var in the env server
                </TooltipContent>
              </Tooltip>
            )}
            {variable.hasConfig === false && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="default" className="shrink-0 !text-foreground-lighter">No config</Badge>
                </TooltipTrigger>
                <TooltipContent side="top">
                  This env var has no corresponding platform config mapping
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-xs text-foreground-lighter">{scopeLabel}</p>
        </div>
      </TableCell>

      {/* Value + eye toggle */}
      <TableCell className="w-72">
        <div className="flex items-center gap-2">
          <Button
            type="text"
            className={cn(
              'px-1 h-6 text-foreground-light hover:text-foreground shrink-0',
              !variable.isSecret && 'invisible'
            )}
            icon={revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            onClick={() => setRevealed((v) => !v)}
          />
          <p
            className={cn(
              'font-mono text-sm text-foreground-light flex-1 truncate',
              variable.isSecret && !revealed && 'tracking-wider'
            )}
          >
            {displayValue}
          </p>
        </div>
      </TableCell>

      {/* Updated at */}
      <TableCell className="hidden lg:table-cell w-40">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-surface-300 border border-default shrink-0" />
          <p className="text-xs text-foreground-lighter whitespace-nowrap">
            {variable.updatedAt
              ? `Updated ${new Date(variable.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : 'Added recently'}
          </p>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-8 text-right">
        {isPlatform ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More options"
                type="text"
                className="px-1"
                icon={<MoreVertical size={14} />}
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
                        ? 'You need additional permissions to edit environment variables'
                        : undefined,
                    },
                  }}
                >
                  Edit variable
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
                        ? 'You need additional permissions to delete environment variables'
                        : undefined,
                    },
                  }}
                >
                  Delete variable
                </ButtonTooltip>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  )
}

export default EnvironmentVariableRow
