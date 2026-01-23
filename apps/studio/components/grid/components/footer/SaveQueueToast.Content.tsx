import { Eye, Trash } from 'lucide-react'
import { Button } from 'ui'

interface SaveQueueToastContentProps {
  count: number
  onSave: () => void
  onViewDetails: () => void
}

export const SaveQueueToastContent = ({
  count,
  onSave,
  onViewDetails,
}: SaveQueueToastContentProps) => {
  return (
    <div onClick={onViewDetails} className="flex items-center justify-between w-full">
      <span className="text-xs">
        {count} pending change{count !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-3">
        <Button size="tiny" type="primary" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}
