import dayjs from 'dayjs'
import { ChartHighlight } from './useChartHighlight'
import Link from 'next/link'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ArrowRight, Activity, BarChartIcon, LogsIcon, XIcon } from 'lucide-react'
import { useParams } from 'common'

export interface ChartHeaderProps {
  title?: string
  format?: string | ((value: unknown) => string)
  customDateFormat?: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
  highlightedLabel?: number | string | any | null
  highlightedValue?: number | string | any | null
  chartHighlight?: ChartHighlight
  hideChartType?: boolean
  chartStyle?: string
  onChartStyleChange?: (style: string) => void
}

const ChartHeader = ({
  format,
  highlightedValue,
  highlightedLabel,
  title,
  minimalHeader = false,
  chartHighlight,
  hideChartType = false,
  chartStyle = 'bar',
  onChartStyleChange,
}: ChartHeaderProps) => {
  const { ref } = useParams()
  const { left: selectedRangeStart, right: selectedRangeEnd, isSelecting } = chartHighlight ?? {}

  const chartTitle = (
    <h3 className={'text-foreground-lighter ' + (minimalHeader ? 'text-xs' : 'text-sm')}>
      {title}
    </h3>
  )

  const highlighted = (
    <h5
      className={`text-foreground text-xl font-normal ${minimalHeader ? 'text-base' : 'text-2xl'}`}
    >
      {highlightedValue !== undefined && highlightedValue}
      {format === 'seconds' ? ' ' : ''}
      <span className="text-lg">
        {typeof format === 'function' ? format(highlightedValue) : format}
      </span>
    </h5>
  )
  const label = <h5 className="text-foreground-lighter text-xs">{highlightedLabel}</h5>

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
    <div className="min-h-16 flex-grow flex justify-between items-start">
      <div className="flex flex-col">
        {title && chartTitle}
        {highlightedValue !== undefined && highlighted}
        {label}
      </div>
      <div className="flex items-center gap-2">
        {/* {selectedRangeStart && selectedRangeStart && !isSelecting && (
          <>
            <Button
              type="text"
              className="px-1.5 -mr-1 text-foreground-lighter"
              onClick={() => chartHighlight?.clearHighlight()}
            >
              <XIcon size={12} />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Button
                    type="outline"
                    className="[&_span]:flex [&_span]:items-center [&_span]:gap-0.5 border-dashed relative pl-1 pr-2"
                    asChild
                  >
                    <Link
                      className="flex items-center gap-0.5 text-foreground-light"
                      href={`/project/${ref}/logs/postgres-logs?iso_timestamp_start=${selectedRangeStart}&iso_timestamp_end=${selectedRangeEnd}`}
                    >
                      <div className="h-5 w-5 mr-0.5 flex items-center justify-center rounded border bg-alternative">
                        <LogsIcon size={12} />
                      </div>
                      <span>{dayjs(selectedRangeStart).format('MMM D, H:mm')}</span>
                      <ArrowRight size={10} />
                      <span>{dayjs(selectedRangeEnd).format('MMM D, H:mm')}</span>
                    </Link>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                Open range in Logs Explorer
              </TooltipContent>
            </Tooltip>
          </>
        )} */}
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
      </div>
    </div>
  )
}

export default ChartHeader
