import { BarChart2 } from 'lucide-react'

import { cn } from 'ui'
import { ChartHeader } from './ChartHeader'
import { useChartSize } from './Charts.utils'

interface NoDataPlaceholderProps {
  title?: string
  attribute?: string
  format?: string | ((value: unknown) => string)
  message?: string
  description?: string
  className?: string
  size: Parameters<typeof useChartSize>[0]
  isFullHeight?: boolean
  titleTooltip?: string
}
const NoDataPlaceholder = ({
  attribute,
  message = 'No data to show',
  description,
  format,
  className = '',
  size,
  isFullHeight = false,
  titleTooltip,
}: NoDataPlaceholderProps) => {
  const { minHeight } = useChartSize(size)

  return (
    <div className={cn(isFullHeight && 'h-full')}>
      {attribute !== undefined && (
        <ChartHeader
          title={attribute}
          format={format}
          highlightedValue={0}
          titleTooltip={titleTooltip}
        />
      )}
      <div
        className={cn(
          'border-control flex flex-grow w-full flex-col items-center justify-center space-y-2 border border-dashed text-center',
          isFullHeight && 'h-full',
          className
        )}
        // extra 20 px for the x ticks
        style={{ minHeight: minHeight + 20 }}
      >
        <BarChart2 size={20} className="text-border-stronger" />
        <div className="px-1">
          <p className="text-foreground-light text-xs">{message}</p>
          {description && <p className="text-foreground-lighter text-xs">{description}</p>}
        </div>
      </div>
    </div>
  )
}
export default NoDataPlaceholder
