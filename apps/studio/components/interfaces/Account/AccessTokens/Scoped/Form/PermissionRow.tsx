import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import type { PermissionCatalogEntry, PermissionMode } from '../../AccessToken.permissions'
import type { EntryAccess } from '../../AccessToken.roles'
import { ExceedsRoleBadge } from '../ExceedsRoleBadge'
import { RiskMarker } from './RiskMarker'

interface PermissionRowProps {
  entry: PermissionCatalogEntry
  mode: PermissionMode
  onChange: (mode: PermissionMode) => void
  entryAccess?: EntryAccess
}

export const PermissionRow = ({ entry, mode, onChange, entryAccess }: PermissionRowProps) => {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex flex-col gap-1">
        <span className="flex items-start md:items-center gap-2 flex-col-reverse md:flex-row">
          <Label htmlFor={`${entry.key}-permissions`}>
            <span className="text-sm text-foreground">
              {entry.name} <span className="sr-only">permissions</span>
            </span>
          </Label>
          <RiskMarker entry={entry} />
          {entryAccess?.status === 'exceeds-role' && (
            <ExceedsRoleBadge entry={entry} mode={mode} access={entryAccess} />
          )}
        </span>
        <p id={`${entry.key}-permissions-description`} className="text-xs text-foreground-lighter">
          {entry.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Select value={mode} onValueChange={(value) => onChange(value as PermissionMode)}>
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
