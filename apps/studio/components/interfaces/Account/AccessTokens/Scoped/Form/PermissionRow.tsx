import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import type { PermissionCatalogEntry, PermissionMode } from '../../AccessToken.permissions'
import { RiskMarker } from './RiskMarker'

interface PermissionRowProps {
  entry: PermissionCatalogEntry
  mode: PermissionMode
  onChange: (mode: PermissionMode) => void
}

export const PermissionRow = ({ entry, mode, onChange }: PermissionRowProps) => {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={`${entry.key}-permissions`} className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {entry.name} <span className="sr-only">permissions</span>
          </span>
          <RiskMarker entry={entry} />
        </Label>
        <p id={`${entry.key}-permissions-description`} className="text-xs text-foreground-light">
          {entry.description}
        </p>
      </div>

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
  )
}
