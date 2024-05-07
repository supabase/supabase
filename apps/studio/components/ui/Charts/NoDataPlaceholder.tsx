import { BarChart2 } from 'lucide-react'
import { useChartSize } from './Charts.utils'

interface Props {
  title?: string
  message?: string
  className?: string
  size: Parameters<typeof useChartSize>[0]
}
const NoDataPlaceholder: React.FC<Props> = ({
  title = 'No data to show',
  message,
  className = '',
  size,
}) => {
  const { minHeight } = useChartSize(size)
  return (
    <div
      className={
        'border-control flex flex-grow w-full flex-col items-center justify-center space-y-2 border border-dashed text-center ' +
        className
      }
      // extra 20 px for the x ticks
      style={{ minHeight: minHeight + 20 }}
    >
      <BarChart2 size={20} className="text-border-stronger" />
      <div>
        <p className="text-foreground-light text-xs">{title}</p>
        {message && <p className="text-foreground-lighter text-xs">{message}</p>}
      </div>
    </div>
  )
}
export default NoDataPlaceholder
