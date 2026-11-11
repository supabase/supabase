import { XIcon } from 'lucide-react'
import { Badge, Button } from 'ui'

import type { LogsView } from '../UnifiedLogs.views'

interface ActiveViewBadgeProps {
  view: LogsView | null
  isModified: boolean
  onUpdate: () => void
  onClear: () => void
}

export const ActiveViewBadge = ({ view, isModified, onUpdate, onClear }: ActiveViewBadgeProps) => {
  if (!view) return null

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Badge className="gap-1">
        <span>{view.name}</span>
        {isModified && <span className="text-foreground-lighter">(modified)</span>}
      </Badge>
      {isModified && (
        <Button variant="text" size="tiny" className="px-1.5" onClick={onUpdate}>
          Update view
        </Button>
      )}
      <Button
        variant="text"
        size="tiny"
        className="px-1"
        icon={<XIcon size={12} />}
        aria-label="Clear active view"
        onClick={onClear}
      />
    </div>
  )
}
