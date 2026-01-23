import { Eye, Trash } from 'lucide-react'
import { Button } from 'ui'

interface SaveQueueToastContentProps {
  count: number
  onSave: () => void
  onCancel: () => void
  onViewDetails: () => void
}

export const SaveQueueToastContent = ({
  count,
  onSave,
  onCancel,
  onViewDetails,
}: SaveQueueToastContentProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs">
        {count} pending change{count !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={onViewDetails}
          className="text-foreground-light hover:text-foreground transition-colors"
          aria-label="View Details"
        >
          <Eye size={14} />
        </button>
        <Button size="tiny" type="primary" onClick={onSave}>
          Save
        </Button>
        <button
          onClick={onCancel}
          className="text-foreground-light hover:text-foreground transition-colors"
          aria-label="Clear changes"
        >
          <Trash size={14} />
        </button>
      </div>
    </div>
  )
}
