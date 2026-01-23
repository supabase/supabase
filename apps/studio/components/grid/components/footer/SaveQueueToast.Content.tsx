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
    <div className="flex items-center gap-3">
      <span className="text-xs">
        {count} pending change{count !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-1.5">
        <Button size="tiny" type="default" onClick={onViewDetails}>
          View Details
        </Button>
        <Button size="tiny" type="primary" onClick={onSave}>
          Save
        </Button>
        <Button size="tiny" type="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
