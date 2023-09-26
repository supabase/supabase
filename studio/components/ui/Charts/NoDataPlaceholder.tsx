import { IconBarChart2 } from 'ui'
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
        'border-scale-600 flex flex-grow w-full flex-col items-center justify-center space-y-2 border border-dashed text-center ' +
        className
      }
      // extra 20 px for the x ticks
      style={{ minHeight: minHeight + 20 }}
    >
      <IconBarChart2 className="text-scale-800" />
      <div>
        <p className="text-foreground-light text-xs">{title}</p>
        {message && <p className="text-scale-900 text-xs">{message}</p>}
      </div>
    </div>
  )
}
export default NoDataPlaceholder
