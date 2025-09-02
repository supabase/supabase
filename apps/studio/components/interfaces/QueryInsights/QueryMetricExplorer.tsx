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
import { formatNumberWithCommas } from './QueryInsights.utils'
import {
  useInsightsMetricsQuery,
  useInsightsPrefetchQuery,
  useAllMetricsQuery,
} from 'data/query-insights/insights-metrics-query'
import { useInsightsQueriesQuery } from 'data/query-insights/insights-queries-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ComposedChart from 'components/ui/Charts/ComposedChart'
import { MultiAttribute } from 'components/ui/Charts/ComposedChart.utils'
import dayjs from 'dayjs'
import { type InsightsQuery } from 'data/query-insights/insights-queries-query'

interface QueryMetricExplorerProps {
  startTime?: string
  endTime?: string
}

const QueryMetricBlock = ({
  label,
  value,
}: {
  label: string
  value: string | number | undefined
}) => {
  return (
    <div className="flex flex-col gap-0.5 text-xs">
      <span className="font-mono text-xs text-foreground-light uppercase">{label}</span>
      <span className="text-lg">{value}</span>
    </div>
  )
}

export const QueryMetricExplorer = ({ startTime, endTime }: QueryMetricExplorerProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [selectedMetric, setSelectedMetric] = useState<
    'rows_read' | 'query_latency' | 'calls' | 'cache_hits'
  >('query_latency')

  const [selectedQuery, setSelectedQuery] = useState<InsightsQuery | undefined>()
  const [selectedQueryId, setSelectedQueryId] = useState<number | undefined>()
  const [hoveredQuery, setHoveredQuery] = useState<InsightsQuery | undefined>()

  const [visiblePercentiles, setVisiblePercentiles] = useState({
    p50: true,
    p75: true,
    p95: true,
    p99: true,
    p99_9: true,
  })

  const safeVisiblePercentiles = useMemo(() => {
    const hasVisible = Object.values(visiblePercentiles).some((v) => v)
    if (!hasVisible) {
      return { ...visiblePercentiles, p95: true }
    }
    return visiblePercentiles
  }, [visiblePercentiles])

  const { startTime: effectiveStartTime, endTime: effectiveEndTime } = useMemo(() => {
    if (startTime && endTime) {
      return { startTime, endTime }
    }
    // Fallback to last 24 hours if no date range provided
    const fallbackEndTime = new Date().toISOString()
    const fallbackStartTime = dayjs().subtract(24, 'hours').toISOString()
    return { startTime: fallbackStartTime, endTime: fallbackEndTime }
  }, [startTime, endTime])

  useInsightsPrefetchQuery(project?.ref, effectiveStartTime, effectiveEndTime)

  const {
    data: metricsData,
    isLoading,
    error,
  } = useInsightsMetricsQuery(project?.ref, selectedMetric, effectiveStartTime, effectiveEndTime, {
    enabled: !!project?.ref,
  })

  // Fetch all metrics for the metric blocks
  const { data: allMetricsData, isLoading: isLoadingAllMetrics } = useAllMetricsQuery(
    project?.ref,
    effectiveStartTime,
    effectiveEndTime,
    {
      enabled: !!project?.ref,
    }
  )

  // Fetch all queries to calculate slowness ratings
  const { data: allQueries, isLoading: isLoadingQueries } = useInsightsQueriesQuery(
    project?.ref,
    effectiveStartTime,
    effectiveEndTime,
    {
      enabled: !!project?.ref,
    }
  )

  // Calculate queries with slowness_rating of "NOTICEABLE" and above
  const slowQueriesCount = useMemo(() => {
    if (!allQueries) return 0

    return allQueries.filter((query) => {
      const rating = query.slowness_rating
      return rating === 'NOTICEABLE' || rating === 'SLOW' || rating === 'CRITICAL'
    }).length
  }, [allQueries])

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
        const totalBlocks =
          (selectedQuery.shared_blks_hit || 0) + (selectedQuery.shared_blks_read || 0)
        return totalBlocks > 0 ? ((selectedQuery.shared_blks_hit || 0) / totalBlocks) * 100 : 0
      default:
        return undefined
    }
  }, [selectedQuery, selectedMetric])

  const getChartAttributes = useMemo((): MultiAttribute[] => {
    const metricConfigs = {
      rows_read: { label: 'Rows Read', format: '' },
      query_latency: { label: 'Query Latency', format: 'ms' },
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
          strokeWidth: 2, // Match Database Reports stroke width
        })
      }

      // Add hovered query attribute if available
      if (hoveredQuery && hoveredQuery !== selectedQuery) {
        const hoveredQueryAverage = hoveredQuery.mean_exec_time

        if (hoveredQueryAverage !== undefined) {
          attributes.push({
            attribute: 'hovered',
            label: 'Hovered',
            format: 'ms',
            provider: 'query-insights' as any,
            color: {
              light: '#7c3aed', // Purple color for hovered query
              dark: '#a855f7',
            },
            strokeDasharray: '3 3', // Dotted line
            type: 'line',
            strokeWidth: 1.5, // Slightly thinner than selected
          })
        }
      }

      return attributes
    }

    const attributes: MultiAttribute[] = []

    if (selectedMetric === 'cache_hits') {
      // For cache hits, show both hits and misses as separate lines
      attributes.push(
        {
          attribute: 'cache_hit_rate',
          label: 'Cache Hit Rate',
          format: '%',
          provider: 'query-insights' as any,
          color: {
            light: '#10b981', // Green for hits
            dark: '#34d399',
          },
        },
        {
          attribute: 'cache_miss_rate',
          label: 'Cache Miss Rate',
          format: '%',
          provider: 'query-insights' as any,
          color: {
            light: '#ef4444', // Red for misses
            dark: '#f87171',
          },
        }
      )
    } else {
      // For other metrics, use the default single attribute
      attributes.push({
        attribute: selectedMetric,
        label: config.label,
        format: config.format,
        provider: 'query-insights' as any,
      })
    }

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
        strokeWidth: 2, // Match Database Reports stroke width
      })
    }

    // Add hovered query attribute if available
    if (hoveredQuery && hoveredQuery !== selectedQuery) {
      let hoveredQueryAverage: number | undefined

      if (selectedMetric === 'calls') {
        hoveredQueryAverage = hoveredQuery.calls
      } else if (selectedMetric === 'rows_read') {
        hoveredQueryAverage = hoveredQuery.rows_read || 0
      } else if (selectedMetric === 'cache_hits') {
        const totalBlocks =
          (hoveredQuery.shared_blks_hit || 0) + (hoveredQuery.shared_blks_read || 0)
        hoveredQueryAverage =
          totalBlocks > 0 ? ((hoveredQuery.shared_blks_hit || 0) / totalBlocks) * 100 : 0
      }

      if (hoveredQueryAverage !== undefined) {
        attributes.push({
          attribute: 'hovered',
          label: 'Hovered',
          format: config.format,
          provider: 'query-insights' as any,
          color: {
            light: '#7c3aed', // Purple color for hovered query
            dark: '#a855f7',
          },
          strokeDasharray: '3 3', // Dotted line
          type: 'line',
          strokeWidth: 1.5, // Slightly thinner than selected
        })
      }
    }

    return attributes
  }, [selectedMetric, safeVisiblePercentiles, selectedQuery, hoveredQuery])

  const transformedChartAttributes = useMemo(() => {
    return getChartAttributes
      .filter((attr) => attr.label && attr.format) // Filter out undefined values
      .map((attr) => ({
        attribute: attr.attribute,
        label: attr.label!,
        format: attr.format!,
        color: attr.color,
        strokeDasharray: attr.strokeDasharray,
        type: attr.type === 'line' ? ('line' as const) : undefined,
        strokeWidth: typeof attr.strokeWidth === 'number' ? attr.strokeWidth : undefined,
      }))
  }, [getChartAttributes])

  // Calculate average P95 for query latency
  const averageP95 = useMemo(() => {
    if (selectedMetric === 'query_latency' && metricsData && metricsData.length > 0) {
      const totalP95 = metricsData.reduce((sum, item) => sum + (item.p95 || 0), 0)
      return totalP95 / metricsData.length
    }
    return undefined
  }, [selectedMetric, metricsData])

  // Get all metrics from the single query
  const totalRowsRead = useMemo(() => {
    if (allMetricsData?.total_rows_read !== undefined) {
      return formatNumberWithCommas(allMetricsData.total_rows_read)
    }
    return '0'
  }, [allMetricsData])

  const totalCalls = useMemo(() => {
    if (allMetricsData?.total_calls !== undefined) {
      return formatNumberWithCommas(allMetricsData.total_calls)
    }
    return '0'
  }, [allMetricsData])

  const totalHits = useMemo(() => {
    if (allMetricsData?.total_hits !== undefined) {
      return formatNumberWithCommas(allMetricsData.total_hits)
    }
    return '0'
  }, [allMetricsData])

  const totalCacheHits = useMemo(() => {
    if (
      allMetricsData?.total_cache_hits !== undefined &&
      allMetricsData?.total_hits !== undefined
    ) {
      const hitRate =
        allMetricsData.total_hits > 0
          ? (allMetricsData.total_cache_hits / allMetricsData.total_hits) * 100
          : 0
      return hitRate.toFixed(1) + '%'
    }
    return '0%'
  }, [allMetricsData])

  const totalCacheMisses = useMemo(() => {
    if (
      allMetricsData?.total_cache_misses !== undefined &&
      allMetricsData?.total_hits !== undefined
    ) {
      const missRate =
        allMetricsData.total_hits > 0
          ? (allMetricsData.total_cache_misses / allMetricsData.total_hits) * 100
          : 0
      return missRate.toFixed(1) + '%'
    }
    return '0%'
  }, [allMetricsData])

  // Transform data for the chart
  const chartData = useMemo(() => {
    if (!metricsData || metricsData.length === 0) {
      return {
        data: [],
        format: '',
        total: 0,
        totalGrouped: {},
      }
    }

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

      // Handle cache_hits metric specially to show both hit and miss rates
      if (selectedMetric === 'cache_hits') {
        const sharedBlksHit = item.shared_blks_hit || 0
        const sharedBlksRead = item.shared_blks_read || 0
        const totalBlocks = sharedBlksHit + sharedBlksRead

        const hitRate = totalBlocks > 0 ? (sharedBlksHit / totalBlocks) * 100 : 0
        const missRate = totalBlocks > 0 ? (sharedBlksRead / totalBlocks) * 100 : 0

        return {
          period_start: periodStart,
          timestamp: timestamp,
          cache_hit_rate: hitRate,
          cache_miss_rate: missRate,
        }
      }

      // For other non-query_latency metrics, use the selectedMetric as the key
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

    // Add hovered query data if available
    if (hoveredQuery && hoveredQuery !== selectedQuery) {
      const hoveredQueryAverage = (() => {
        switch (selectedMetric) {
          case 'query_latency':
            return hoveredQuery.mean_exec_time
          case 'calls':
            return hoveredQuery.calls
          case 'rows_read':
            return hoveredQuery.rows_read || 0
          case 'cache_hits':
            const totalBlocks =
              (hoveredQuery.shared_blks_hit || 0) + (hoveredQuery.shared_blks_read || 0)
            return totalBlocks > 0 ? ((hoveredQuery.shared_blks_hit || 0) / totalBlocks) * 100 : 0
          default:
            return undefined
        }
      })()

      if (hoveredQueryAverage !== undefined) {
        // Add the hovered query average as a constant line across all data points
        const transformedWithHovered = transformed.map((item) => ({
          ...item,
          hovered: hoveredQueryAverage,
        }))
        transformed.splice(0, transformed.length, ...transformedWithHovered)
      }
    }

    // Calculate totals for the ChartData format
    const total = transformed.reduce((sum, item) => {
      if (selectedMetric === 'query_latency') {
        // For query latency, sum the p95 values as the main metric
        const p95Value = (item as any).p95 || 0
        return sum + p95Value
      } else if (selectedMetric === 'cache_hits') {
        // For cache hits, use the hit rate as the main metric
        const hitRate = (item as any).cache_hit_rate || 0
        return sum + hitRate
      } else {
        // For other metrics, use the selectedMetric key
        const value = (item as any)[selectedMetric]
        return sum + (typeof value === 'number' ? value : 0)
      }
    }, 0)

    const totalGrouped = (() => {
      if (selectedMetric === 'query_latency') {
        return { p95: total }
      } else if (selectedMetric === 'cache_hits') {
        return { cache_hit_rate: total }
      } else {
        return { [selectedMetric]: total }
      }
    })()

    return {
      data: transformed,
      format: getChartAttributes[0].format || '',
      total,
      totalGrouped,
    }
  }, [
    metricsData,
    selectedMetric,
    safeVisiblePercentiles,
    selectedQuery,
    selectedQueryAverage,
    hoveredQuery,
  ])

  // Mock updateDateRange function for LogChartHandler
  const updateDateRange = () => {
    // This is a no-op since we're not implementing date range updates in this component
    console.log('updateDateRange called - not implemented in QueryMetricExplorer')
  }

  // Handle query selection from child component
  const handleQuerySelect = useCallback(
    (query: InsightsQuery | undefined) => {
      setSelectedQuery(query)
      setSelectedQueryId(query?.query_id)
    },
    [] // No dependencies to prevent unnecessary recreations
  )

  // Handle query hover from child component
  const handleQueryHover = useCallback(
    (query: InsightsQuery | undefined) => {
      setHoveredQuery(query)
    },
    [] // No dependencies to prevent unnecessary recreations
  )

  // Clear selected query
  const clearSelectedQuery = useCallback(() => {
    setSelectedQuery(undefined)
    setSelectedQueryId(undefined)
  }, []) // No dependencies to prevent unnecessary recreations

  // Clear hovered query
  const clearHoveredQuery = useCallback(() => {
    setHoveredQuery(undefined)
  }, []) // No dependencies to prevent unnecessary recreations

  // Reset selection when date range changes
  useEffect(() => {
    clearSelectedQuery()
    clearHoveredQuery()
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
                {isLoading || isLoadingQueries ? (
                  <div className="h-full min-h-[264px] flex items-center justify-center">
                    <div className="text-sm text-foreground-lighter">Loading metrics...</div>
                  </div>
                ) : chartData.data.length > 0 ? (
                  <>
                    {(() => {
                      const metricsConfig = {
                        query_latency: [
                          {
                            label: 'Average p95',
                            value: averageP95?.toFixed(2).toLocaleString() + 'ms',
                          },
                          { label: 'Slow queries', value: slowQueriesCount },
                        ],
                        rows_read: [{ label: 'Total rows read', value: totalRowsRead }],
                        calls: [{ label: 'Total calls', value: totalCalls }],
                        cache_hits: [
                          { label: 'Total hits', value: totalHits },
                          { label: 'Cache hits', value: totalCacheHits },
                          { label: 'Cache misses', value: totalCacheMisses },
                        ],
                      }

                      const currentMetrics =
                        metricsConfig[selectedMetric as keyof typeof metricsConfig] || []

                      return (
                        currentMetrics.length > 0 && (
                          <div className="flex flex-row gap-6 mt-1 absolute w-full">
                            {currentMetrics.map((metric, index) => (
                              <QueryMetricBlock
                                key={index}
                                label={metric.label}
                                value={metric.value}
                              />
                            ))}
                          </div>
                        )
                      )
                    })()}

                    <ComposedChart
                      data={chartData.data}
                      attributes={getChartAttributes}
                      yAxisKey={getChartAttributes[0].attribute}
                      xAxisKey="period_start"
                      title={''}
                      customDateFormat="HH:mm"
                      hideChartType={true}
                      hideHighlightedValue={true}
                      hideHighlightedLabel={true}
                      showTooltip={true}
                      showGrid={true}
                      showLegend={
                        selectedMetric === 'query_latency' ||
                        selectedMetric === 'cache_hits' ||
                        !!selectedQuery
                      }
                      showTotal={false}
                      showMaxValue={false}
                      updateDateRange={updateDateRange}
                      YAxisProps={{
                        tick: true,
                        width: 60,
                        tickFormatter: (value) => value.toLocaleString(),
                      }}
                      className="my-3"
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
          onQueryHover={handleQueryHover}
        />
      </Card>
    </div>
  )
}
