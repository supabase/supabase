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

  const displayValue = revealed ? variable.value || '(write-only)' : '••••••••••••••'

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-surface-100 group">
      {/* Icon */}
      <div className="flex items-center justify-center w-8 h-8 rounded border border-default bg-surface-100 shrink-0">
        {variable.isSecret ? (
          <Lock size={14} className="text-foreground-light" />
        ) : (
          <Code size={14} className="text-foreground-light" />
        )}
      </div>

      {/* Name + scope */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-mono text-sm truncate">{variable.name}</p>
          {variable.isSecret && (
            <Badge variant="default" className="shrink-0">Sensitive</Badge>
          )}
          {variable.hasEnvVar === false && (
            <Badge variant="warning" className="shrink-0">No env var</Badge>
          )}
          {variable.hasConfig === false && (
            <Badge variant="warning" className="shrink-0">No config</Badge>
          )}
        </div>
        <p className="text-xs text-foreground-lighter">{scopeLabel}</p>
      </div>

      {/* Masked value + eye toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="text"
          className="px-1 h-6 text-foreground-light hover:text-foreground"
          icon={revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={() => setRevealed((v) => !v)}
        />
        <p
          className={cn(
            'font-mono text-sm text-foreground-light w-36 truncate',
            !revealed && 'tracking-wider'
          )}
        >
          {displayValue}
        </p>
      </div>

      {/* Updated at + mock avatar */}
      <div className="flex items-center gap-2 shrink-0 hidden lg:flex">
        <div className="w-5 h-5 rounded-full bg-surface-300 border border-default" />
        <p className="text-xs text-foreground-lighter">
          {variable.updatedAt
            ? `Updated ${new Date(variable.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : 'Added recently'}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0">
        {isPlatform ? (
          <div className="w-7" />
        ) : (
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
      </div>
    </div>
  )
}

export default EnvironmentVariableRow
