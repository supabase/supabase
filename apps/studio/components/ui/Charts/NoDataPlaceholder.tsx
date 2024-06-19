import { BarChart2 } from 'lucide-react'
import { useChartSize } from './Charts.utils'
import ChartHeader from './ChartHeader'

interface NoDataPlaceholderProps {
  title?: string
  attribute?: string
  format?: string | ((value: unknown) => string)
  message?: string
  description?: string
  className?: string
  size: Parameters<typeof useChartSize>[0]
}
const NoDataPlaceholder = ({
  attribute,
  message = 'No data to show',
  description,
  format,
  className = '',
  size,
}: NoDataPlaceholderProps) => {
  const { minHeight } = useChartSize(size)

  return (
    <div>
      {attribute !== undefined && (
        <ChartHeader title={attribute} format={format} highlightedValue={0} />
      )}
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
          <p className="text-foreground-light text-xs">{message}</p>
          {description && <p className="text-foreground-lighter text-xs">{description}</p>}
        </div>
      </div>
    </div>
  )
}
export default NoDataPlaceholder
