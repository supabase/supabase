import { useState, useMemo } from 'react'
import {
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Card,
  CardContent,
  CardHeader,
} from 'ui'
import { QueryRowExplorer } from './QueryRowExplorer'
import {
  useInsightsMetricsQuery,
  useInsightsPrefetchQuery,
} from 'data/query-insights/insights-metrics-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ComposedChart from 'components/ui/Charts/ComposedChart'
import { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import dayjs from 'dayjs'

interface QueryMetricExplorerProps {
  startTime?: string
  endTime?: string
}

export const QueryMetricExplorer = ({ startTime, endTime }: QueryMetricExplorerProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [selectedMetric, setSelectedMetric] = useState<
    'rows_read' | 'query_latency' | 'queries_per_second' | 'calls' | 'cache_hits'
  >('query_latency')

  // State to control which percentile lines are visible for query latency
  const [visiblePercentiles, setVisiblePercentiles] = useState({
    p50: true,
    p75: true,
    p95: true,
    p99: true,
    p99_9: true,
  })

  // Ensure at least one percentile is always visible
  const safeVisiblePercentiles = useMemo(() => {
    const hasVisible = Object.values(visiblePercentiles).some((v) => v)
    if (!hasVisible) {
      // If all are hidden, show P95 by default
      return { ...visiblePercentiles, p95: true }
    }
    return visiblePercentiles
  }, [visiblePercentiles])

  // Use provided date range or fall back to default
  const { startTime: effectiveStartTime, endTime: effectiveEndTime } = useMemo(() => {
    if (startTime && endTime) {
      return { startTime, endTime }
    }
    // Fallback to last 24 hours if no date range provided
    const fallbackEndTime = new Date().toISOString()
    const fallbackStartTime = dayjs().subtract(24, 'hours').toISOString()
    return { startTime: fallbackStartTime, endTime: fallbackEndTime }
  }, [startTime, endTime])

  // Pre-fetch query data for the QueryRowExplorer
  useInsightsPrefetchQuery(project?.ref, effectiveStartTime, effectiveEndTime)

  // Debug logging
  console.log('QueryMetricExplorer Debug:', {
    props: { startTime, endTime },
    effective: { startTime: effectiveStartTime, endTime: effectiveEndTime },
    project: { ref: project?.ref, hasConnectionString: !!project?.connectionString },
    selectedMetric,
  })

  const {
    data: metricsData,
    isLoading,
    error,
  } = useInsightsMetricsQuery(project?.ref, selectedMetric, effectiveStartTime, effectiveEndTime)

  // Debug logging for query results
  console.log('QueryMetricExplorer Query Results:', {
    metricsData,
    isLoading,
    error,
    dataLength: metricsData?.length,
  })

  // Define chart attributes based on selected metric
  const getChartAttributes = (): MultiAttribute[] => {
    const metricConfigs = {
      rows_read: { label: 'Rows Read', format: '' },
      query_latency: { label: 'Query Latency', format: 'ms' },
      queries_per_second: { label: 'Queries/Second', format: '/s' },
      calls: { label: 'Calls', format: '' },
      cache_hits: { label: 'Cache Hit Rate', format: '%' },
    }

    const config = metricConfigs[selectedMetric]

    if (selectedMetric === 'query_latency') {
      const attributes: MultiAttribute[] = []

      if (safeVisiblePercentiles.p50) {
        attributes.push({
          attribute: 'p50',
          label: 'P50',
          format: 'ms',
          provider: 'query-insights' as any,
        })
      }

      if (safeVisiblePercentiles.p75) {
        attributes.push({
          attribute: 'p75',
          label: 'P75',
          format: 'ms',
          provider: 'query-insights' as any,
        })
      }

      if (safeVisiblePercentiles.p95) {
        attributes.push({
          attribute: 'p95',
          label: 'P95',
          format: 'ms',
          provider: 'query-insights' as any,
        })
      }

      if (safeVisiblePercentiles.p99) {
        attributes.push({
          attribute: 'p99',
          label: 'P99',
          format: 'ms',
          provider: 'query-insights' as any,
        })
      }

      if (safeVisiblePercentiles.p99_9) {
        attributes.push({
          attribute: 'p99_9',
          label: 'P99.9',
          format: 'ms',
          provider: 'query-insights' as any,
        })
      }

      // Ensure we always have at least one attribute (p95 as fallback)
      if (attributes.length === 0) {
        attributes.push({
          attribute: 'p95',
          label: 'P95',
          format: 'ms',
          provider: 'query-insights' as any,
        })
      }

      return attributes
    }

    return [
      {
        attribute: selectedMetric,
        label: config.label,
        format: config.format,
        provider: 'query-insights' as any,
      },
    ]
  }

  // Calculate average P95 for query latency
  const averageP95 = useMemo(() => {
    if (selectedMetric === 'query_latency' && metricsData && metricsData.length > 0) {
      const totalP95 = metricsData.reduce((sum, item) => sum + (item.p95 || 0), 0)
      return totalP95 / metricsData.length
    }
    return undefined
  }, [selectedMetric, metricsData])

  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!metricsData || metricsData.length === 0) {
      console.log('QueryMetricExplorer: No metrics data available')
      return {
        data: [],
        format: '',
        total: 0,
        totalGrouped: {},
      }
    }

    console.log('QueryMetricExplorer: Processing metrics data:', {
      metricsData,
      selectedMetric,
      dataLength: metricsData.length,
      firstItem: metricsData[0],
    })

    const transformed = metricsData.map((item) => {
      // Convert timestamp to ISO string format as expected by ChartData
      const periodStart = new Date(item.timestamp).toISOString()
      const timestamp = new Date(item.timestamp).getTime()
      const value = item.value || 0

      // Add percentile data for query latency
      if (selectedMetric === 'query_latency') {
        const percentileData: any = {
          period_start: periodStart,
          timestamp: timestamp,
        }

        // Only include percentiles that are visible
        if (safeVisiblePercentiles.p50) percentileData.p50 = item.p50 || 0
        if (safeVisiblePercentiles.p75) percentileData.p75 = item.p75 || 0
        if (safeVisiblePercentiles.p95) percentileData.p95 = item.p95 || 0
        if (safeVisiblePercentiles.p99) percentileData.p99 = item.p99 || 0
        if (safeVisiblePercentiles.p99_9) percentileData.p99_9 = item.p99_9 || 0

        return percentileData
      }

      // For non-query_latency metrics, use the selectedMetric as the key
      return {
        period_start: periodStart,
        timestamp: timestamp,
        [selectedMetric]: value,
      }
    })

    // Calculate totals for the ChartData format
    const total = transformed.reduce((sum, item) => {
      if (selectedMetric === 'query_latency') {
        // For query latency, sum the p95 values as the main metric
        const p95Value = (item as any).p95 || 0
        return sum + p95Value
      } else {
        // For other metrics, use the selectedMetric key
        const value = (item as any)[selectedMetric]
        return sum + (typeof value === 'number' ? value : 0)
      }
    }, 0)

    const totalGrouped =
      selectedMetric === 'query_latency'
        ? { p95: total } // Use p95 as the main metric for query latency
        : { [selectedMetric]: total }

    console.log('QueryMetricExplorer Chart Data:', {
      originalData: metricsData,
      transformedData: transformed,
      selectedMetric,
      dataLength: transformed.length,
      visiblePercentiles,
      total,
      totalGrouped,
    })

    return {
      data: transformed,
      format: getChartAttributes()[0].format || '',
      total,
      totalGrouped,
    }
  }, [metricsData, selectedMetric, safeVisiblePercentiles])

  // Mock updateDateRange function for LogChartHandler
  const updateDateRange = () => {
    // This is a no-op since we're not implementing date range updates in this component
    console.log('updateDateRange called - not implemented in QueryMetricExplorer')
  }

  return (
    <div className="w-full mb-4">
      <Card>
        <Tabs_Shadcn_
          value={selectedMetric}
          onValueChange={(value) => setSelectedMetric(value as any)}
          className="w-full"
        >
          <CardHeader className="h-10 py-0 pl-4 pr-2 flex flex-row items-center justify-between flex-0">
            <TabsList_Shadcn_ className="flex justify-start rounded-none gap-x-4 border-b-0 !mt-0 pt-0">
              <TabsTrigger_Shadcn_
                value="query_latency"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Query latency
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="rows_read"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Rows read
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="calls"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Calls
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="cache_hits"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                Cache hits
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_
                value="queries_per_second"
                className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
              >
                QPS
              </TabsTrigger_Shadcn_>
            </TabsList_Shadcn_>
          </CardHeader>

          <CardContent className="!p-0 mt-0 flex-1">
            <TabsContent_Shadcn_ value={selectedMetric} className="bg-surface-100 mt-0">
              <div className="p-4">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-sm text-foreground-lighter">Loading metrics...</div>
                  </div>
                ) : chartData.data.length > 0 ? (
                  <>
                    <ComposedChart
                      data={chartData.data}
                      attributes={getChartAttributes()}
                      yAxisKey={getChartAttributes()[0].attribute}
                      xAxisKey="timestamp"
                      title={getChartAttributes()[0].label || ''}
                      customDateFormat="HH:mm"
                      hideChartType={true}
                      showTooltip={true}
                      showLegend={selectedMetric === 'query_latency'}
                      showTotal={false}
                      showMaxValue={false}
                      updateDateRange={updateDateRange}
                    />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-sm text-foreground-lighter">No data available</div>
                  </div>
                )}
              </div>
            </TabsContent_Shadcn_>
          </CardContent>
        </Tabs_Shadcn_>
        <QueryRowExplorer startTime={effectiveStartTime} endTime={effectiveEndTime} />
      </Card>
    </div>
  )
}
