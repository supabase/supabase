import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { QueryInsightsMetric } from 'data/query-insights/query-insights-query'
import dayjs from 'dayjs'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  cn,
} from 'ui'
import { useState } from 'react'

interface MetricsChartProps {
  data: QueryInsightsMetric[] | undefined
  metric: string
  isLoading: boolean
}

export const MetricsChart = ({ data, metric, isLoading }: MetricsChartProps) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    p50: true,
    p95: true,
    p99: true,
    p99_9: true,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-foreground-light">Loading metrics...</div>
      </div>
    )
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-foreground-light">No data available</div>
      </div>
    )
  }

  if (metric === 'query_latency') {
    const chartData = data.map((point) => ({
      timestamp: dayjs(point.timestamp).format('HH:mm'),
      p50: point.p50,
      p95: point.p95,
      p99: point.p99,
      p99_9: point.p99_9,
    }))

    const config = {
      p50: {
        label: 'p50',
        color: 'hsl(var(--brand-default))',
      },
      p95: {
        label: 'p95',
        color: 'hsl(var(--foreground-default))',
      },
      p99: {
        label: 'p99',
        color: 'hsl(var(--warning-default))',
      },
      p99_9: {
        label: 'p99.9',
        color: 'hsl(var(--destructive-default))',
      },
    } satisfies ChartConfig

    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {Object.entries(config).map(([key, value]) => {
            const metricValue = Number(
              chartData[chartData.length - 1]?.[key as keyof (typeof chartData)[0]]
            )
            const formattedValue = !isNaN(metricValue) ? `${Math.round(metricValue)} ms` : '0 ms'

            return (
              <button
                key={key}
                className={cn(
                  'text-xs px-2 py-1 rounded-full transition-colors inline-flex items-center gap-1.5',
                  visibleMetrics[key as keyof typeof visibleMetrics]
                    ? 'bg-surface-300'
                    : 'hover:bg-surface-100'
                )}
                onClick={() =>
                  setVisibleMetrics((prev) => ({
                    ...prev,
                    [key]: !prev[key as keyof typeof visibleMetrics],
                  }))
                }
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: value.color }} />
                <span>
                  {value.label}: {formattedValue}
                </span>
              </button>
            )
          })}
        </div>
        <ChartContainer className="h-[300px] w-full" config={config}>
          <AreaChart
            data={chartData}
            width={100}
            height={100}
            style={{ width: '100%', height: '100%' }}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <defs>
              {Object.entries(config).map(([key, value]) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={value.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={value.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              interval="preserveStartEnd"
              minTickGap={50}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {visibleMetrics.p50 && (
              <Area
                type="monotone"
                dataKey="p50"
                fill={config.p50.color}
                fillOpacity={0.4}
                stroke={config.p50.color}
                strokeWidth={2}
                dot={false}
                animationDuration={100}
              />
            )}
            {visibleMetrics.p95 && (
              <Area
                type="monotone"
                dataKey="p95"
                fill={config.p95.color}
                fillOpacity={0.4}
                stroke={config.p95.color}
                strokeWidth={2}
                dot={false}
                animationDuration={100}
              />
            )}
            {visibleMetrics.p99 && (
              <Area
                type="monotone"
                dataKey="p99"
                fill={config.p99.color}
                fillOpacity={0.4}
                stroke={config.p99.color}
                strokeWidth={2}
                dot={false}
                animationDuration={100}
              />
            )}
            {visibleMetrics.p99_9 && (
              <Area
                type="monotone"
                dataKey="p99_9"
                fill={config.p99_9.color}
                fillOpacity={0.4}
                stroke={config.p99_9.color}
                strokeWidth={2}
                dot={false}
                animationDuration={100}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </div>
    )
  }

  // For other metrics, use the bar chart
  const chartData = data.map((point) => ({
    timestamp: dayjs(point.timestamp).toISOString(),
    ok_count: point.value ?? 0,
    warning_count: 0,
    error_count: 0,
  }))

  return (
    <LogsBarChart
      data={chartData}
      DateTimeFormat="HH:mm"
      EmptyState={
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-foreground-light">No data available</div>
        </div>
      }
    />
  )
}
