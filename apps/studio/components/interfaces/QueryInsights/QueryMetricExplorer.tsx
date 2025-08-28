import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Card,
  CardContent,
  CardHeader,
  Button,
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
import { type InsightsQuery } from 'data/query-insights/insights-queries-query'

interface QueryMetricExplorerProps {
  startTime?: string
  endTime?: string
}

export const QueryMetricExplorer = ({ startTime, endTime }: QueryMetricExplorerProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [selectedMetric, setSelectedMetric] = useState<
    'rows_read' | 'query_latency' | 'queries_per_second' | 'calls' | 'cache_hits'
  >('query_latency')

  // State to track selected query for chart highlighting
  const [selectedQuery, setSelectedQuery] = useState<InsightsQuery | undefined>()
  const [selectedQueryId, setSelectedQueryId] = useState<number | undefined>()

  // Debug logging for query selection (commented out to reduce console noise)
  // console.log('QueryMetricExplorer Query Selection:', {
  //   selectedQuery: selectedQuery?.query_id,
  //   selectedQueryId,
  //   selectedQueryQuery: selectedQuery?.query?.substring(0, 50) + '...',
  // })

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

  // Debug logging (commented out to reduce console noise)
  // console.log('QueryMetricExplorer Debug:', {
  //   props: { startTime, endTime },
  //   effective: { startTime: effectiveStartTime, endTime: effectiveEndTime },
  //   project: { ref: project?.ref, hasConnectionString: !!project?.connectionString },
  //   selectedMetric,
  //   projectRefUndefined: !project?.ref,
  // })

  const {
    data: metricsData,
    isLoading,
    error,
  } = useInsightsMetricsQuery(project?.ref, selectedMetric, effectiveStartTime, effectiveEndTime, {
    enabled: !!project?.ref,
  })

  // Calculate the average value for the selected query based on the current metric
  const selectedQueryAverage = useMemo(() => {
    if (!selectedQuery) return undefined

    switch (selectedMetric) {
      case 'query_latency':
        return selectedQuery.mean_exec_time
      case 'calls':
        return selectedQuery.calls
      case 'rows_read':
        return selectedQuery.rows_read || 0
      case 'cache_hits':
        // Calculate cache hit rate from shared_blks_hit and shared_blks_read
        const totalBlocks =
          (selectedQuery.shared_blks_hit || 0) + (selectedQuery.shared_blks_read || 0)
        return totalBlocks > 0 ? ((selectedQuery.shared_blks_hit || 0) / totalBlocks) * 100 : 0
      case 'queries_per_second':
        // Calculate QPS from calls and total_time
        const totalTimeSeconds = (selectedQuery.total_time || 0) / 1000
        return totalTimeSeconds > 0 ? (selectedQuery.calls || 0) / totalTimeSeconds : 0
      default:
        return undefined
    }
  }, [selectedQuery, selectedMetric])

  // Debug logging for query results (commented out to reduce console noise)
  // console.log('QueryMetricExplorer Query Results:', {
  //   metricsData,
  //   isLoading,
  //   error,
  //   dataLength: metricsData?.length,
  // })

  // Define chart attributes based on selected metric
  const getChartAttributes = useMemo((): MultiAttribute[] => {
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

      // Add selected query attribute if available
      if (selectedQuery && selectedQueryAverage !== undefined) {
        attributes.push({
          attribute: 'selected',
          label: 'Selected',
          format: 'ms',
          provider: 'query-insights' as any,
          color: {
            light: '#dc2626', // Bright red color for selected query
            dark: '#ef4444',
          },
          strokeDasharray: '5 5', // Dashed line
          type: 'line',
          strokeWidth: 4, // Even thicker line for more prominence
        })
      }

      return attributes
    }

    const attributes: MultiAttribute[] = [
      {
        attribute: selectedMetric,
        label: config.label,
        format: config.format,
        provider: 'query-insights' as any,
      },
    ]

    // Add selected query attribute if available
    if (selectedQuery && selectedQueryAverage !== undefined) {
      attributes.push({
        attribute: 'selected',
        label: 'Selected',
        format: config.format,
        provider: 'query-insights' as any,
        color: {
          light: '#dc2626', // Bright red color for selected query
          dark: '#ef4444',
        },
        strokeDasharray: '5 5', // Dashed line
        type: 'line',
        strokeWidth: 4, // Even thicker line for more prominence
      })
    }

    return attributes
  }, [selectedMetric, safeVisiblePercentiles, selectedQuery])

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
      // console.log('QueryMetricExplorer: No metrics data available')
      return {
        data: [],
        format: '',
        total: 0,
        totalGrouped: {},
      }
    }

    // console.log('QueryMetricExplorer: Processing metrics data:', {
    //   metricsData,
    //   selectedMetric,
    //   dataLength: metricsData.length,
    //   firstItem: metricsData[0],
    // })

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

    // Add selected query data if available
    if (selectedQuery && selectedQueryAverage !== undefined) {
      // Add the selected query average as a constant line across all data points
      const transformedWithSelected = transformed.map((item) => ({
        ...item,
        selected: selectedQueryAverage,
      }))
      transformed.splice(0, transformed.length, ...transformedWithSelected)

      // Debug: Check if selected query data was added
      console.log('Chart Data Merge Debug:', {
        selectedQueryId: selectedQuery?.query_id,
        selectedQueryAverage,
        transformedLength: transformed.length,
        hasSelectedData: transformed.some((item) => item.selected !== undefined),
        sampleTransformedItem: transformed[0],
        chartAttributes: getChartAttributes.map((attr) => ({
          attribute: attr.attribute,
          label: attr.label,
          type: attr.type,
        })),
        hasSelectedAttribute: getChartAttributes.some((attr) => attr.attribute === 'selected'),
      })
    }

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

    // console.log('QueryMetricExplorer Chart Data:', {
    //   originalData: metricsData,
    //   transformedData: transformed,
    //   selectedMetric,
    //   dataLength: transformed.length,
    //   visiblePercentiles,
    //   total,
    //   totalGrouped,
    //   selectedQuery: selectedQuery?.query_id,
    //   selectedQueryDataLength: selectedQueryData.length,
    //   selectedQueryData: selectedQueryData,
    //   selectedQueryLatency: selectedQueryLatency,
    //   selectedQueryCalls: selectedQueryCalls,
    //   selectedQueryRows: selectedQueryRows,
    // })

    return {
      data: transformed,
      format: getChartAttributes[0].format || '',
      total,
      totalGrouped,
    }
  }, [metricsData, selectedMetric, safeVisiblePercentiles, selectedQuery, selectedQueryAverage])

  // Mock updateDateRange function for LogChartHandler
  const updateDateRange = () => {
    // This is a no-op since we're not implementing date range updates in this component
    console.log('updateDateRange called - not implemented in QueryMetricExplorer')
  }

  // Handle query selection from child component
  const handleQuerySelect = useCallback(
    (query: InsightsQuery | undefined) => {
      // console.log('QueryMetricExplorer: handleQuerySelect called', {
      //   newQuery: query?.query_id,
      //   currentSelectedQuery: selectedQuery?.query_id,
      //   currentSelectedQueryId: selectedQueryId,
      //   willUpdate:
      //     query?.query_id !== selectedQuery?.query_id || query?.query_id !== selectedQueryId,
      //   timestamp: new Date().toISOString(),
      // })
      setSelectedQuery(query)
      setSelectedQueryId(query?.query_id)
    },
    [] // No dependencies to prevent unnecessary recreations
  )

  // Clear selected query
  const clearSelectedQuery = useCallback(() => {
    // console.log('QueryMetricExplorer: Clearing selected query', {
    //   currentSelectedQuery: selectedQuery?.query_id,
    //   currentSelectedQueryId: selectedQueryId,
    // })
    setSelectedQuery(undefined)
    setSelectedQueryId(undefined)
  }, []) // No dependencies to prevent unnecessary recreations

  // Reset selection when date range changes
  useEffect(() => {
    clearSelectedQuery()
  }, [effectiveStartTime, effectiveEndTime])

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
              <div className="p-4 relative">
                {selectedQuery && (
                  <div className="absolute top-4 right-4 z-10">
                    <Button type="default" size="tiny" onClick={clearSelectedQuery}>
                      Clear query
                    </Button>
                  </div>
                )}
                {isLoading ? (
                  <div className="h-full min-h-[264px] flex items-center justify-center">
                    <div className="text-sm text-foreground-lighter">Loading metrics...</div>
                  </div>
                ) : chartData.data.length > 0 ? (
                  <>
                    {(() => {
                      console.log('Chart Data Final Debug:', {
                        chartDataLength: chartData.data.length,
                        firstDataPoint: chartData.data[0],
                        attributes: getChartAttributes.map((attr) => attr.attribute),
                        selectedQuery: selectedQuery?.query_id,
                        // Check if selected query data is in the final chart data
                        hasSelectedQueryData: chartData.data.some(
                          (item) => item.selected !== undefined
                        ),
                        selectedQueryDataPoints: chartData.data.filter(
                          (item) => item.selected !== undefined
                        ).length,
                      })
                      return null
                    })()}
                    <ComposedChart
                      data={chartData.data}
                      attributes={getChartAttributes}
                      yAxisKey={getChartAttributes[0].attribute}
                      xAxisKey="period_start"
                      title={getChartAttributes[0].label || ''}
                      customDateFormat="HH:mm"
                      hideChartType={true}
                      showTooltip={true}
                      showLegend={selectedMetric === 'query_latency' || !!selectedQuery}
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
        <QueryRowExplorer
          startTime={effectiveStartTime}
          endTime={effectiveEndTime}
          onQuerySelect={handleQuerySelect}
          selectedQueryId={selectedQueryId}
        />
      </Card>
    </div>
  )
}
