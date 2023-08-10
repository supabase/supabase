import { IconBarChart2 } from 'ui'

interface EmptyStateProps {
  title?: string
  message?: string
}

const EmptyState = ({
  title = 'No data to show',
  message = 'May take 24 hours for data to show',
}: EmptyStateProps) => (
  <div
    className="
      flex h-full
      w-full flex-col items-center
      justify-center space-y-2 space-y-2 border
      border-dashed border-scale-600 py-4 text-center
    "
  >
    <IconBarChart2 className="text-scale-1100" />
    <div>
      <p className="text-xs text-scale-1100">{title}</p>
      <p className="text-xs text-scale-1000">{message}</p>
    </div>
  </div>
)

export default EmptyState
