import { Eye } from 'lucide-react'
import { Button } from 'ui'

import { getModKey } from 'components/grid/hooks/useOperationQueueShortcuts'

interface SaveQueueToastContentProps {
  count: number
  isSaving: boolean
  onSave: () => void
  onViewDetails: () => void
}

const ShortcutHint = ({ keys }: { keys: string }) => (
  <span className="text-foreground-lighter text-[10px] ml-1">{keys}</span>
)

export const SaveQueueToastContent = ({
  count,
  isSaving,
  onSave,
  onViewDetails,
}: SaveQueueToastContentProps) => {
  const modKey = getModKey()

  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs">
        {count} pending change{count !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={onViewDetails}
          className="text-foreground-light hover:text-foreground transition-colors flex items-center"
          aria-label="View Details"
        >
          <Eye size={14} />
          <ShortcutHint keys={`${modKey}.`} />
        </button>
        <Button size="tiny" type="primary" onClick={onSave} disabled={isSaving} loading={isSaving}>
          Save
          <ShortcutHint keys={`${modKey}S`} />
        </Button>
      </div>
    </div>
  )
}
