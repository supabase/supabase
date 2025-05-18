import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Activity, BarChartIcon, GitCommitHorizontalIcon } from 'lucide-react'

export interface ChartHeaderProps {
  title?: string
  format?: string | ((value: unknown) => string)
  customDateFormat?: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
  highlightedLabel?: number | string | any | null
  highlightedValue?: number | string | any | null
  hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
  showMaxValue?: boolean
  setShowMaxValue?: (value: boolean) => void
}

const ChartHeader = ({
  format,
  highlightedValue,
  highlightedLabel,
  title,
  minimalHeader = false,
  hideChartType = false,
  chartStyle = 'bar',
  onChartStyleChange,
  showMaxValue = false,
  setShowMaxValue,
}: ChartHeaderProps) => {
  const chartTitle = (
    <h3 className={'text-foreground-lighter ' + (minimalHeader ? 'text-xs' : 'text-sm')}>
      {title}
    </h3>
  )

  const highlighted = (
    <h4
      className={`text-foreground text-xl font-normal ${minimalHeader ? 'text-base' : 'text-2xl'}`}
    >
      {highlightedValue !== undefined && highlightedValue}
      {format === 'seconds' ? ' ' : ''}
      <span className="text-lg">
        {typeof format === 'function' ? format(highlightedValue) : format}
      </span>
    </h4>
  )
  const label = <h4 className="text-foreground-lighter text-xs">{highlightedLabel}</h4>

  if (minimalHeader) {
    return (
      <div className="flex flex-row items-center gap-x-4" style={{ minHeight: '1.8rem' }}>
        {title && chartTitle}
        <div className="flex flex-row items-baseline gap-x-2">
          {highlightedValue !== undefined && highlighted}
          {label}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-grow flex justify-between items-start min-h-16">
      <div className="flex flex-col">
        {title && chartTitle}
        {highlightedValue !== undefined && highlighted}
        {label}
      </div>
      <div className="flex items-center gap-2">
        {!hideChartType && onChartStyleChange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="default"
                className="px-1.5"
                icon={chartStyle === 'bar' ? <Activity /> : <BarChartIcon />}
                onClick={() => onChartStyleChange(chartStyle === 'bar' ? 'line' : 'bar')}
              />
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              View as {chartStyle === 'bar' ? 'line chart' : 'bar chart'}
            </TooltipContent>
          </Tooltip>
        )}
        {setShowMaxValue && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type={showMaxValue ? 'default' : 'dashed'}
                className="px-1.5"
                icon={
                  <GitCommitHorizontalIcon
                    className={showMaxValue ? 'text-foreground' : 'text-foreground-lighter'}
                  />
                }
                onClick={() => setShowMaxValue(!showMaxValue)}
              />
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              {showMaxValue ? 'Hide' : 'Show'} limit
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export default ChartHeader
