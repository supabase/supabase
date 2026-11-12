import dayjs from 'dayjs'
import { InfoIcon } from 'lucide-react'
import { Card, CardContent, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
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
  isExample?: boolean
  unit: 'ms' | '/s'
}

export const WarehouseWorkloadChart = ({
  title,
  description,
  points,
  metric,
  value,
  isExample = false,
  unit,
}: WarehouseWorkloadChartProps) => {
  const notice = metric && getWarehouseSummaryNotice(metric)
  const hasValues = points.some((point) => point.value !== undefined)

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm text-foreground-light">{title}</h3>
          {!isExample && (
            <Tooltip>
              <TooltipTrigger aria-label={`About ${title.toLowerCase()}`}>
                <InfoIcon size={14} className="text-foreground-lighter" />
              </TooltipTrigger>
              <TooltipContent className="max-w-72">{description}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {!isExample && <p className="text-xl tabular-nums">{value ?? 'Unavailable'}</p>}
        {hasValues && (
          <div
            className={isExample ? 'pointer-events-none opacity-35' : undefined}
            aria-hidden={isExample || undefined}
          >
            <ChartLine
              className="h-36"
              isFullHeight
              data={points}
              dataKey="value"
              config={{ value: { label: title, color: 'var(--chart-1)' } }}
              color="var(--chart-1)"
              showXAxis={!isExample}
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
        {metric?.timestamp !== null && metric?.timestamp !== undefined && (
          <p className="text-xs text-foreground-lighter">
            Interval ending {dayjs.unix(metric.timestamp).format('HH:mm')}
          </p>
        )}
        {hasValues && notice && <p className="text-xs text-foreground-light">{notice}</p>}
      </CardContent>
    </Card>
  )
}
