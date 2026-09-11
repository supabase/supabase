import { Fragment, useEffect, useEffectEvent } from 'react'
import { Control } from 'react-hook-form'
import {
  cn,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useWatch,
} from 'ui'

import type { PermissionCatalogEntry, PermissionMode } from '../../AccessToken.permissions'
import type { EntryAccess } from '../../AccessToken.roles'
import { ExceedsRoleBadge } from '../ExceedsRoleBadge'
import { TokenFormValues } from './NewScopedTokenForm.utils'
import { RiskMarker } from './RiskMarker'

interface PermissionRowProps {
  control: Control<TokenFormValues>
  entry: PermissionCatalogEntry
  mode: PermissionMode
  onChange: (mode: PermissionMode) => void
  entryAccess?: EntryAccess
}

export const PermissionRow = ({
  control,
  entry,
  mode,
  onChange,
  entryAccess,
}: PermissionRowProps) => {
  const isMissingDependencies = useWatch({
    control,
    name: 'permissions',
    disabled: entry.dependencies.length === 0,
    compute: (permissions) => {
      let isMissingDependencies = false

      for (const dependency of entry.dependencies) {
        if (permissions[dependency.key] == null || permissions[dependency.key] == 'none') {
          isMissingDependencies = true
        }
      }
      return isMissingDependencies
    },
  })

  const onChangeEvent = useEffectEvent(onChange)
  useEffect(() => {
    if (isMissingDependencies && mode !== 'none') {
      onChangeEvent('none')
    }
  }, [isMissingDependencies, mode])

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex flex-col gap-1">
        <span className="flex items-start md:items-center gap-2 flex-col-reverse md:flex-row">
          <Label htmlFor={`${entry.key}-permissions`}>
            <span
              className={cn('text-sm text-foreground', isMissingDependencies && 'text-lighter')}
            >
              {entry.name} <span className="sr-only">permissions</span>
            </span>
          </Label>
          <RiskMarker entry={entry} className={cn(isMissingDependencies && 'opacity-75')} />
          {entryAccess?.status === 'exceeds-role' && (
            <ExceedsRoleBadge entry={entry} mode={mode} access={entryAccess} />
          )}
        </span>
        <p id={`${entry.key}-permissions-description`} className="text-xs text-foreground-lighter">
          {entry.description}
          {entry.dependencies.length > 0 ? (
            <b>
              {' '}
              Requires{' '}
              {entry.dependencies.map((dependency, index) => (
                <Fragment key={dependency.key}>
                  {dependency.label} set to{' '}
                  {dependency.permissions === 'read' ? 'read' : 'read or read-write'}
                  {index < entry.dependencies.length - 1 ? ', ' : null}
                </Fragment>
              ))}
              .
            </b>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Select
          disabled={isMissingDependencies}
          value={mode}
          onValueChange={(value) => onChange(value as PermissionMode)}
        >
          <SelectTrigger
            className="w-36 shrink-0"
            id={`${entry.key}-permissions`}
            aria-describedby={`${entry.key}-permissions-description`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            {entry.writable && <SelectItem value="readwrite">Read-write</SelectItem>}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
