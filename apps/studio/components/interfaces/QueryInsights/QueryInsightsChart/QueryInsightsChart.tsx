import { Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn, Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import type { ChartDataPoint } from '../QueryInsights.types'
import { CHART_TABS, CHART_TYPE, LEGEND_ITEMS, SEL_COLOR } from './QueryInsightsChart.constants'
import { formatTime } from './QueryInsightsChart.utils'
import { QueryInsightsChartTooltip } from './QueryInsightsChartTooltip'

interface QueryInsightsChartProps {
  chartData: ChartDataPoint[]
  selectedChartData?: ChartDataPoint[]
  isLoading: boolean
}

export const QueryInsightsChart = ({
  chartData,
  selectedChartData,
  isLoading,
}: QueryInsightsChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState('query_latency')
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme?.includes('dark')

  const data = useMemo(() => {
    const normalize = (ts: number) => (ts > 1e13 ? Math.floor(ts / 1000) : ts)
    const selByTime = new Map((selectedChartData ?? []).map((d) => [normalize(d.period_start), d]))

    return chartData.map((d) => {
      const t = normalize(d.period_start)
      const sel = selByTime.get(t)
      return {
        time: t,
        p50: d.p50_time,
        p95: d.p95_time,
        rows_read: d.rows_read,
        calls: d.calls,
        cache_hits: d.cache_hits,
        sel_p50: sel?.p50_time,
        sel_rows_read: sel?.rows_read,
        sel_calls: sel?.calls,
        sel_cache_hits: sel?.cache_hits,
      }
    })
  }, [chartData, selectedChartData])

  const filteredData = useMemo(() => {
    if (hiddenSeries.size === 0) return data
    return data.map((point) => {
      const filtered = { ...point } as Record<string, number | undefined>
      hiddenSeries.forEach((key) => {
        filtered[key] = undefined
      })
      return filtered
    })
  }, [data, hiddenSeries])

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) {
        next.delete(dataKey)
      } else {
        next.add(dataKey)
      }
      return next
    })
  }

  const hasSelection = !!selectedChartData && selectedChartData.length > 0
  const selDataKey = selectedMetric === 'query_latency' ? 'sel_p50' : `sel_${selectedMetric}`
  const legendItems = LEGEND_ITEMS[selectedMetric] ?? []

  return (
    <div className="bg-surface-100 border-b min-h-[320px]">
      <Tabs_Shadcn_ value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
        <TabsList_Shadcn_ className="flex justify-start rounded-none gap-x-4 border-b mt-0! pt-0 px-6">
          {CHART_TABS.map((tab) => (
            <TabsTrigger_Shadcn_
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 text-xs py-3 border-b font-mono uppercase"
            >
              {tab.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        <TabsContent_Shadcn_ value={selectedMetric} className="bg-surface-100 mt-0">
          <div className="w-full gap-4 mt-4 px-6 flex items-center justify-end">
            {legendItems.map((item: { dataKey: string; label: string; color: string }) => (
              <button
                key={item.dataKey}
                type="button"
                onClick={() => toggleSeries(item.dataKey)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer',
                  !hiddenSeries.has(item.dataKey)
                    ? 'text-foreground hover:text-foreground-light'
                    : 'text-foreground-muted'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-opacity',
                    hiddenSeries.has(item.dataKey) && 'opacity-30'
                  )}
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </button>
            ))}
            {hasSelection && (
              <button
                type="button"
                onClick={() => toggleSeries(selDataKey)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] transition-colors cursor-pointer',
                  !hiddenSeries.has(selDataKey)
                    ? 'text-foreground hover:text-foreground-light'
                    : 'text-foreground-muted'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-xs transition-opacity',
                    hiddenSeries.has(selDataKey) && 'opacity-30'
                  )}
                  style={{ backgroundColor: SEL_COLOR }}
                />
                Selected query
              </button>
            )}
          </div>
          <div className="w-full py-4 flex flex-col">
            <div className="w-full h-[180px] px-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={20} className="animate-spin text-foreground-lighter" />
                </div>
              ) : data.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-foreground-lighter">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData} margin={{ top: 4, left: 0, right: 0, bottom: 4 }}>
                    <defs>
                      {legendItems.map((item) => (
                        <linearGradient
                          key={`gradient-${item.dataKey}`}
                          id={`gradient-${item.dataKey}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={item.color} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                      {hasSelection && (
                        <linearGradient id={`gradient-${selDataKey}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SEL_COLOR} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={SEL_COLOR} stopOpacity={0} />
                        </linearGradient>
                      )}
                    </defs>
                    <XAxis
                      dataKey="time"
                      tick={false}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border-default))' }}
                      height={1}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'hsl(var(--foreground-muted))' }}
                      tickCount={3}
                      width={40}
                      orientation="left"
                      tickFormatter={(v) =>
                        selectedMetric === 'query_latency'
                          ? `${Math.round(v)}ms`
                          : `${Math.round(v)}`
                      }
                      mirror={true}
                    />
                    <Tooltip
                      content={<QueryInsightsChartTooltip />}
                      cursor={{
                        stroke: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        strokeWidth: 1,
                      }}
                    />
                    <CartesianGrid
                      horizontal={true}
                      vertical={false}
                      stroke="hsl(var(--border-default))"
                      strokeOpacity={0.5}
                    />
                    {legendItems.map((item) => (
                      <Area
                        key={item.dataKey}
                        type={CHART_TYPE}
                        dataKey={item.dataKey}
                        stroke={item.color}
                        strokeWidth={1}
                        fill={`url(#gradient-${item.dataKey})`}
                        dot={false}
                        name={item.label}
                        strokeOpacity={
                          !hiddenSeries.has(item.dataKey) ? (hasSelection ? 0.2 : 1) : 0
                        }
                        fillOpacity={!hiddenSeries.has(item.dataKey) ? (hasSelection ? 0.2 : 1) : 0}
                      />
                    ))}
                    {hasSelection && (
                      <Area
                        type={CHART_TYPE}
                        dataKey={selDataKey}
                        stroke={SEL_COLOR}
                        strokeWidth={1}
                        fill={`url(#gradient-${selDataKey})`}
                        dot={false}
                        name="Selected query"
                        connectNulls={false}
                        strokeOpacity={!hiddenSeries.has(selDataKey) ? 1 : 0}
                        fillOpacity={!hiddenSeries.has(selDataKey) ? 1 : 0}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {data.length > 0 && (
              <div className="flex justify-between text-xs text-foreground-lighter pt-2 px-6">
                <span>{formatTime(data[0].time)}</span>
                <span>{formatTime(data[data.length - 1].time)}</span>
              </div>
            )}
          </div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}
