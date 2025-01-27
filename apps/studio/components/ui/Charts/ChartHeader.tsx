import dayjs from 'dayjs'
import { ChartHighlight } from './useChartHighlight'
import Link from 'next/link'
import { Button } from 'ui'
import { useRouter } from 'next-router-mock'
import { ArrowRight } from 'lucide-react'

export interface ChartHeaderProps {
  title?: string
  format?: string | ((value: unknown) => string)
  customDateFormat?: string
  minimalHeader?: boolean
  displayDateInUtc?: boolean
  highlightedLabel?: number | string | null
  highlightedValue?: number | string | null
  chartHighlight?: ChartHighlight
}

const ChartHeader = ({
  format,
  highlightedValue,
  highlightedLabel,
  title,
  minimalHeader = false,
  chartHighlight,
}: ChartHeaderProps) => {
  const router = useRouter()
  const { ref } = router.query
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
      {highlightedValue !== undefined && String(highlightedValue)}
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
    <div className="h-16 flex justify-between items-start">
      <div className="flex flex-col">
        {title && chartTitle}
        {highlightedValue !== undefined && highlighted}
        {label}
      </div>
      <div>
        {selectedRangeStart && selectedRangeStart && !isSelecting && (
          <div className="flex items-center gap-2">
            <Button
              type="outline"
              className="[&_span]:flex [&_span]:items-center [&_span]:gap-0.5 [&_span]:text-foreground-light [&_span]:text-xs"
              disabled
            >
              {dayjs(selectedRangeStart).format('MMM D, H:mm')} <ArrowRight size={10} />{' '}
              {dayjs(selectedRangeEnd).format('MMM D, H:mm')}
            </Button>
            <Button size="tiny" type="default" asChild>
              <Link
                href={`/project/${ref}/reports/database?dateRange=${selectedRangeStart}-${selectedRangeEnd}`}
              >
                Open Logs
              </Link>
            </Button>
            <Button size="tiny" type="default">
              Zoom in
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChartHeader
