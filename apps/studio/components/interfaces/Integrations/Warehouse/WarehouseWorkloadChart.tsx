import { InfoIcon } from 'lucide-react'
import { Card, CardContent, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ChartLine } from 'ui-patterns/Chart'

import type {
  WarehouseSummaryPoint,
  WarehouseSummaryValue,
} from './WarehouseObservabilitySection.utils'
import { getWarehouseSummaryNotice } from './WarehouseObservabilitySection.utils'

interface WarehouseWorkloadChartProps {
  title: string
  description: string
  points: WarehouseSummaryPoint[]
  metric?: WarehouseSummaryValue
  value?: string
  unit: 'ms' | '/s'
  isPreview?: boolean
}

export const WarehouseWorkloadChart = ({
  title,
  description,
  points,
  metric,
  value,
  unit,
  isPreview = false,
}: WarehouseWorkloadChartProps) => {
  const notice = metric && getWarehouseSummaryNotice(metric)
  const hasValues = points.some((point) => point.value !== undefined)

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-normal text-foreground-light">{title}</h3>
          {!isPreview && (
            <Tooltip>
              <TooltipTrigger
                className="inline-flex shrink-0"
                aria-label={`About ${title.toLowerCase()}`}
              >
                <InfoIcon size={14} className="text-foreground-lighter" />
              </TooltipTrigger>
              <TooltipContent className="max-w-72">{description}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {isPreview && (
          <div aria-hidden="true" className="h-7 w-20 rounded bg-surface-200 opacity-50" />
        )}
        {!isPreview && <p className="text-xl tabular-nums">{value ?? 'Unavailable'}</p>}
        {hasValues && (
          <div
            inert={isPreview || undefined}
            aria-hidden={isPreview || undefined}
            className={cn(isPreview && 'pointer-events-none opacity-40 grayscale')}
          >
            <ChartLine
              className="h-36"
              isFullHeight
              data={
                isPreview ? points.map((point, index) => ({ index, value: point.value })) : points
              }
              xKey={isPreview ? 'index' : 'timestamp'}
              dataKey="value"
              config={{ value: { label: title, color: 'var(--chart-1)' } }}
              color="var(--chart-1)"
              showXAxis={false}
              DateTimeFormat="MMM D, HH:mm"
              showYAxis={false}
              showHighlightArea={false}
              tooltipDetails={(_, __, pointValue) => `${pointValue}${unit === 'ms' ? ' ms' : '/s'}`}
            />
          </div>
        )}
        {!hasValues && (
          <div className="flex min-h-36 items-center justify-center text-sm text-foreground-light">
            {notice ?? 'Waiting for query measurements'}
          </div>
        )}
        {hasValues && notice && <p className="text-xs text-foreground-light">{notice}</p>}
      </CardContent>
    </Card>
  )
}
