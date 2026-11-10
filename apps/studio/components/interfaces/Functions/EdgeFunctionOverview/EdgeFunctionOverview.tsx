import { IS_PLATFORM, useParams } from 'common'
import { ExternalLinkIcon } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { EdgeFunctionIntervalSelector } from './EdgeFunctionIntervalSelector'
import { EdgeFunctionInvocationsSection } from './EdgeFunctionInvocationsSection'
import {
  EDGE_FUNCTION_CHART_INTERVALS,
  getExecutionMetrics,
  getInvocationChartData,
  getInvocationChartNavigationUrl,
  getInvocationTotals,
  getInvocationUpdateAnnotation,
  getRollingTimeRange,
  getUsageMetrics,
  toEdgeFunctionChartData,
} from './EdgeFunctionOverview.utils'
import type { EdgeFunctionChartRawDatum } from './EdgeFunctionOverview.utils'
import { EdgeFunctionOverviewHeader } from './EdgeFunctionOverviewHeader'
import { EdgeFunctionPerformanceSection } from './EdgeFunctionPerformanceSection'
import { EdgeFunctionRecentErrors } from './EdgeFunctionRecentErrors'
import { toAlertError } from './EdgeFunctionRecentErrors.utils'
import { EdgeFunctionUsageSection } from './EdgeFunctionUsageSection'
import { useEdgeFunctionOverviewShortcuts } from './useEdgeFunctionOverviewShortcuts'
import { FunctionObservabilityDisabled } from '@/components/interfaces/Functions/FunctionObservabilityDisabled'
import { useFunctionObservability } from '@/components/interfaces/Functions/useFunctionObservability'
import { AlertError } from '@/components/ui/AlertError'
import { NoPermission } from '@/components/ui/NoPermission'
import {
  FunctionsCombinedStatsVariables,
  useFunctionsCombinedStatsQuery,
} from '@/data/analytics/functions-combined-stats-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useFillTimeseriesSorted } from '@/hooks/analytics/useFillTimeseriesSorted'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const EdgeFunctionOverview = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const {
    isEnabled: isUnifiedLogsEnabled,
    isAvailable: isObservabilityAvailable,
    isLoading: isLoadingObservability,
    error: observabilityError,
  } = useFunctionObservability()

  const [interval, setInterval] = useState<string>('1hr')
  const selectedInterval =
    EDGE_FUNCTION_CHART_INTERVALS.find((item) => item.key === interval) ||
    EDGE_FUNCTION_CHART_INTERVALS[1]
  const {
    data: selectedFunction,
    error: functionError,
    isPending: isLoadingFunction,
    isError: isErrorFunction,
  } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })
  const id = selectedFunction?.id
  const combinedStatsResults = useFunctionsCombinedStatsQuery(
    {
      projectRef,
      functionId: id,
      interval: selectedInterval.key as FunctionsCombinedStatsVariables['interval'],
    },
    {
      enabled: isObservabilityAvailable,
    }
  )

  const combinedStatsData = useMemo(
    () => (combinedStatsResults.data?.result as EdgeFunctionChartRawDatum[] | undefined) || [],
    [combinedStatsResults.data]
  )

  const [startDate, endDate] = useMemo(
    () =>
      getRollingTimeRange(
        selectedInterval,
        new Date(combinedStatsResults.dataUpdatedAt || Date.now())
      ),
    [selectedInterval, combinedStatsResults.dataUpdatedAt]
  )
  const dateTimeFormat = selectedInterval.format ?? 'MMM D, h:mma'

  const {
    data: combinedStatsChartData,
    error: combinedStatsError,
    isError: isErrorTimeseries,
  } = useFillTimeseriesSorted({
    data: combinedStatsData,
    timestampKey: 'timestamp',
    valueKey: [
      'requests_count',
      'log_count',
      'log_info_count',
      'log_warn_count',
      'log_error_count',
      'success_count',
      'redirect_count',
      'client_err_count',
      'server_err_count',
      'avg_cpu_time_used',
      'avg_memory_used',
      'avg_execution_time',
      'max_execution_time',
      'avg_heap_memory_used',
      'avg_external_memory_used',
      'max_cpu_time_used',
    ],
    defaultValue: 0,
  })

  const isErrorCombinedStats = combinedStatsResults.isError || isErrorTimeseries
  const chartError = toAlertError(combinedStatsResults.error ?? combinedStatsError)

  const chartData = useMemo(
    () => toEdgeFunctionChartData(IS_PLATFORM ? combinedStatsChartData : combinedStatsData),
    [combinedStatsChartData, combinedStatsData]
  )
  const usageData = IS_PLATFORM ? chartData : chartData.filter((row) => (row.worker_count ?? 0) > 0)
  const performanceData = IS_PLATFORM
    ? chartData
    : chartData.filter((row) => (row.requests_count ?? 0) > 0)
  const invocationChartData = useMemo(() => getInvocationChartData(chartData), [chartData])
  const { totalInvocationCount, totalWarningCount, totalErrorCount } = useMemo(
    () => getInvocationTotals(invocationChartData),
    [invocationChartData]
  )
  const { averageExecutionTime, maxExecutionTime } = getExecutionMetrics(performanceData)
  const {
    averageCpuTime,
    maxCpuTime,
    averageMemoryUsage,
    totalHeapMemory,
    totalExternalMemory,
    totalMemoryByType,
  } = getUsageMetrics(usageData)
  const invocationUpdateAnnotation = useMemo(
    () =>
      getInvocationUpdateAnnotation({
        updatedAt: selectedFunction?.updated_at,
        invocationChartData,
        windowStart: startDate,
        windowEnd: endDate,
      }),
    [invocationChartData, selectedFunction?.updated_at, endDate, startDate]
  )

  const invocationActions = useMemo(
    () => [
      {
        label: isUnifiedLogsEnabled ? 'Open logs' : 'Open invocations',
        href: `/project/${projectRef}/functions/${functionSlug}/${
          isUnifiedLogsEnabled ? 'logs' : 'invocations'
        }`,
        icon: <ExternalLinkIcon size={12} />,
      },
    ],
    [functionSlug, isUnifiedLogsEnabled, projectRef]
  )

  useEdgeFunctionOverviewShortcuts({
    onSetInterval: setInterval,
    onRefresh: () => {
      if (isObservabilityAvailable) combinedStatsResults.refetch()
    },
    onOpenLogs: () => {
      router.push(
        `/project/${projectRef}/functions/${functionSlug}/${
          isUnifiedLogsEnabled ? 'logs' : 'invocations'
        }`
      )
    },
  })

  const { isLoading: permissionsLoading, can: canReadFunction } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ
  )

  if (!canReadFunction && !permissionsLoading) {
    return <NoPermission isFullPage resourceText="access this edge function" />
  }

  if (!IS_PLATFORM && isLoadingObservability) return <ShimmeringLoader className="m-6 h-40" />
  if (observabilityError)
    return <AlertError error={observabilityError} subject="Failed to load logging configuration" />

  if (!isObservabilityAvailable) {
    return <FunctionObservabilityDisabled />
  }

  return (
    <>
      <EdgeFunctionOverviewHeader
        actions={
          <EdgeFunctionIntervalSelector interval={interval} onIntervalChange={setInterval} />
        }
      />
      <PageContainer size="default">
        <EdgeFunctionInvocationsSection
          dateTimeFormat={dateTimeFormat}
          actions={invocationActions}
          totalInvocationCount={totalInvocationCount}
          totalErrorCount={totalErrorCount}
          totalWarningCount={totalWarningCount}
          isLoadingFunction={isLoadingFunction}
          isErrorFunction={isErrorFunction}
          functionError={functionError}
          isLoadingChart={combinedStatsResults.isLoading}
          isErrorChart={isErrorCombinedStats}
          chartErrorMessage={chartError?.message ?? 'Unknown error'}
          chartData={invocationChartData}
          onChartClick={(timestamp) => {
            if (!projectRef || !functionSlug) return

            router.push(
              getInvocationChartNavigationUrl({
                projectRef,
                functionSlug,
                isUnifiedLogsEnabled,
                rangeStart: startDate.toISOString(),
                rangeEnd: endDate.toISOString(),
                clickedTimestamp: timestamp,
              })
            )
          }}
          updateAnnotation={invocationUpdateAnnotation}
        />

        <EdgeFunctionRecentErrors
          functionId={id}
          functionSlug={functionSlug as string}
          projectRef={projectRef as string}
          updatedAt={selectedFunction?.updated_at}
        />

        <EdgeFunctionPerformanceSection
          data={performanceData}
          dateTimeFormat={dateTimeFormat}
          isLoading={combinedStatsResults.isLoading}
          isError={isErrorCombinedStats}
          errorMessage={chartError?.message ?? 'Unknown error'}
          averageExecutionTime={averageExecutionTime}
          maxExecutionTime={maxExecutionTime}
        />

        <EdgeFunctionUsageSection
          data={usageData}
          dateTimeFormat={dateTimeFormat}
          isLoading={combinedStatsResults.isLoading}
          isError={isErrorCombinedStats}
          errorMessage={chartError?.message ?? 'Unknown error'}
          averageCpuTime={averageCpuTime}
          maxCpuTime={maxCpuTime}
          averageMemoryUsage={averageMemoryUsage}
          totalHeapMemory={totalHeapMemory}
          totalExternalMemory={totalExternalMemory}
          totalMemoryByType={totalMemoryByType}
        />
      </PageContainer>
    </>
  )
}
