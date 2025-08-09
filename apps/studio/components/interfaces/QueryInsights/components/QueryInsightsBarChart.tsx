import { useState } from 'react'
import { Line, XAxis, YAxis, Tooltip, Area, ComposedChart } from 'recharts'
import { ChartContainer, ChartConfig } from 'components/ui/Charts'
import { CHART_COLORS } from 'components/ui/Charts/Charts.constants'
import dayjs from 'dayjs'
import { cn } from 'ui'

export interface QueryInsightsChartDatum {
  timestamp: string
  p50: number
  p95: number
  p99: number
  p999: number
}

export const QueryInsightsLineChart = ({
  data,
  onPointClick,
  EmptyState,
  DateTimeFormat = 'MMM D, HH:mm',
}: {
  data: QueryInsightsChartDatum[]
  onPointClick?: (datum: QueryInsightsChartDatum, tooltipData?: Record<string, any>) => void
  EmptyState?: React.ReactNode
  DateTimeFormat?: string
}) => {
  const [focusDataIndex, setFocusDataIndex] = useState<number | null>(null)

  if (data.length === 0) {
    if (EmptyState) return EmptyState
    return null
  }

  const startDate = dayjs(data[0]['timestamp']).format(DateTimeFormat)
  const endDate = dayjs(data[data?.length - 1]?.['timestamp']).format(DateTimeFormat)

  return (
    <div className={cn('flex flex-col gap-y-3')}>
      <ChartContainer
        config={
          {
            p50: {
              label: 'p50',
              color: CHART_COLORS.GREEN_1,
            },
            p95: {
              label: 'p95',
              color: CHART_COLORS.BLUE_1,
            },
            p99: {
              label: 'p99',
              color: '#925AFF',
            },
            p999: {
              label: 'p99.9',
              color: '#FF8B3E',
            },
          } satisfies ChartConfig
        }
        className="h-[400px]"
      >
        <ComposedChart
          data={data}
          onMouseMove={(e: { activeTooltipIndex: number | null }) => {
            if (e.activeTooltipIndex !== focusDataIndex) {
              setFocusDataIndex(e.activeTooltipIndex)
            }
          }}
          onMouseLeave={() => setFocusDataIndex(null)}
          onClick={(tooltipData: Record<string, any>) => {
            const datum = tooltipData?.activePayload?.[0]?.payload
            if (onPointClick) onPointClick(datum, tooltipData)
          }}
        >
          <defs>
            <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.BLUE_1} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_COLORS.BLUE_1} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="timestamp"
            tickFormatter={(v) => dayjs(v).format(DateTimeFormat)}
            stroke={CHART_COLORS.AXIS}
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}ms`}
            stroke={CHART_COLORS.AXIS}
            fontSize={10}
            tickLine={false}
          />
          <Tooltip
            labelFormatter={(v) => dayjs(v).format(DateTimeFormat)}
            formatter={(value: number) => [`${value}ms`]}
          />

          <Area type="monotone" dataKey="p95" stroke="none" fill="url(#p95Gradient)" />

          <Line
            type="monotone"
            dataKey="p50"
            stroke={CHART_COLORS.GREEN_1}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="p95"
            stroke={CHART_COLORS.BLUE_1}
            strokeWidth={1.5}
            dot={false}
          />
          <Line type="monotone" dataKey="p99" stroke="#925AFF" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="p999" stroke="#FF8B3E" strokeWidth={1.5} dot={false} />
        </ComposedChart>
      </ChartContainer>
      {data && (
        <div className="text-foreground-lighter -mt-10 flex items-center justify-between text-[10px] font-mono">
          <span>{startDate}</span>
          <span>{endDate}</span>
        </div>
      )}
    </div>
  )
}
