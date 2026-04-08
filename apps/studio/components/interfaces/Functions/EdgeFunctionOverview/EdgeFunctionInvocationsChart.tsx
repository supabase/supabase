import { Rocket } from 'lucide-react'
import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  BarChart as RechartBarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

import {
  formatChartTimestamp,
  getChartTimeRangeLabels,
  INVOCATION_CHART_CONFIG,
} from './EdgeFunctionOverview.utils'
import type { InvocationChartDatum, InvocationUpdateAnnotation } from './EdgeFunctionOverview.utils'

interface EdgeFunctionInvocationsChartProps {
  chartData: InvocationChartDatum[]
  dateTimeFormat: string
  onChartClick: () => void
  updateAnnotation?: InvocationUpdateAnnotation
}

export const EdgeFunctionInvocationsChart = ({
  chartData,
  dateTimeFormat,
  onChartClick,
  updateAnnotation,
}: EdgeFunctionInvocationsChartProps) => {
  const timeRangeLabels = useMemo(
    () => getChartTimeRangeLabels(chartData, dateTimeFormat),
    [chartData, dateTimeFormat]
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-40 w-full overflow-visible">
        <ChartContainer config={INVOCATION_CHART_CONFIG} className="!aspect-auto !h-full !w-full">
          <RechartBarChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            onClick={onChartClick}
          >
            <CartesianGrid vertical={false} />
            <YAxis hide width={0} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tick={false}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="text-foreground-light"
                  labelFormatter={(value) =>
                    formatChartTimestamp(value as string | number | undefined, dateTimeFormat)
                  }
                  indicator="dot"
                />
              }
            />
            <Bar
              dataKey="error_count"
              stackId="invocations"
              fill="var(--color-error_count)"
              maxBarSize={24}
            />
            <Bar
              dataKey="warning_count"
              stackId="invocations"
              fill="var(--color-warning_count)"
              maxBarSize={24}
            />
            <Bar
              dataKey="ok_count"
              stackId="invocations"
              fill="var(--color-ok_count)"
              maxBarSize={24}
            />
            {updateAnnotation && (
              <ReferenceLine
                x={updateAnnotation.timestamp}
                stroke="hsl(var(--foreground-default))"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
          </RechartBarChart>
        </ChartContainer>
        {updateAnnotation && (
          <span
            className="pointer-events-none absolute bottom-0 z-10 flex h-6 w-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-foreground/20 bg-background text-foreground shadow-sm"
            style={{ left: `${updateAnnotation.position}%` }}
            title={`Updated ${formatChartTimestamp(updateAnnotation.updatedAt, dateTimeFormat)}`}
          >
            <Rocket size={12} strokeWidth={1.75} />
          </span>
        )}
      </div>
      {timeRangeLabels && (
        <div className="-mt-6 flex items-center justify-between text-[10px] font-mono text-foreground-lighter">
          <span>{timeRangeLabels.start}</span>
          <span>{timeRangeLabels.end}</span>
        </div>
      )}
    </div>
  )
}
