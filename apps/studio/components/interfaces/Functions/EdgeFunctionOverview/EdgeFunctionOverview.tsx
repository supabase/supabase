import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { EdgeFunctionInvocationsSection } from './EdgeFunctionInvocationsSection'
import {
  EDGE_FUNCTION_CHART_INTERVALS,
  getBucketedTimeRange,
  getExecutionMetrics,
  getInvocationChartData,
  getInvocationTotals,
  getInvocationUpdateAnnotation,
  getRollingTimeRange,
  getUsageMetrics,
  toEdgeFunctionChartData,
} from './EdgeFunctionOverview.utils'
import type { EdgeFunctionChartRawDatum } from './EdgeFunctionOverview.utils'
import { EdgeFunctionPerformanceSection } from './EdgeFunctionPerformanceSection'
import { EdgeFunctionRecentErrors } from './EdgeFunctionRecentErrors'
import { EdgeFunctionUsageSection } from './EdgeFunctionUsageSection'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import NoPermission from '@/components/ui/NoPermission'
import {
  FunctionsCombinedStatsVariables,
  useFunctionsCombinedStatsQuery,
} from '@/data/analytics/functions-combined-stats-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useFillTimeseriesSorted } from '@/hooks/analytics/useFillTimeseriesSorted'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const EdgeFunctionOverview = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const [interval, setInterval] = useState<string>('15min')
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
      enabled: IS_PLATFORM,
    }
  )

  const combinedStatsData = useMemo(
    () => (combinedStatsResults.data?.result as EdgeFunctionChartRawDatum[] | undefined) || [],
    [combinedStatsResults.data]
  )

  const [startDate, endDate] = useMemo(
    () => getBucketedTimeRange(selectedInterval),
    [selectedInterval]
  )
  const [selectedWindowStart, selectedWindowEnd] = useMemo(
    () => getRollingTimeRange(selectedInterval),
    [selectedInterval]
  )
  const dateTimeFormat = selectedInterval.format ?? 'MMM D, h:mma'

  const {
    data: combinedStatsChartData,
    error: combinedStatsError,
    isError: isErrorCombinedStats,
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
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })

  const chartData = useMemo(
    () => toEdgeFunctionChartData(combinedStatsChartData),
    [combinedStatsChartData]
  )
  const invocationChartData = useMemo(() => getInvocationChartData(chartData), [chartData])
  const { totalInvocationCount, totalWarningCount, totalErrorCount } = useMemo(
    () => getInvocationTotals(invocationChartData),
    [invocationChartData]
  )
  const { averageExecutionTime, maxExecutionTime } = useMemo(
    () => getExecutionMetrics(chartData),
    [chartData]
  )
  const {
    averageCpuTime,
    maxCpuTime,
    averageMemoryUsage,
    totalHeapMemory,
    totalExternalMemory,
    totalMemoryByType,
  } = useMemo(() => getUsageMetrics(chartData), [chartData])
  const invocationUpdateAnnotation = useMemo(
    () =>
      getInvocationUpdateAnnotation({
        updatedAt:
          selectedFunction?.updated_at === undefined
            ? undefined
            : String(selectedFunction.updated_at),
        invocationChartData,
        windowStart: selectedWindowStart,
        windowEnd: selectedWindowEnd,
      }),
    [invocationChartData, selectedFunction?.updated_at, selectedWindowEnd, selectedWindowStart]
  )

  const invocationActions = useMemo(
    () => [
      {
        label: isUnifiedLogsEnabled ? 'Open logs' : 'Open invocations',
        href: `/project/${projectRef}/functions/${functionSlug}/${
          isUnifiedLogsEnabled ? 'logs' : 'invocations'
        }`,
        icon: <ExternalLink size={12} />,
      },
    ],
    [functionSlug, isUnifiedLogsEnabled, projectRef]
  )

  const { isLoading: permissionsLoading, can: canReadFunction } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    functionSlug as string
  )

  useEffect(() => {
    if (!IS_PLATFORM && projectRef && functionSlug) {
      router.replace(`/project/${projectRef}/functions/${functionSlug}/details`)
    }
  }, [functionSlug, projectRef, router])

  if (!canReadFunction && !permissionsLoading) {
    return <NoPermission isFullPage resourceText="access this edge function" />
  }

  if (!IS_PLATFORM) {
    return null
  }

  return (
    <>
      <EdgeFunctionInvocationsSection
        interval={interval}
        onIntervalChange={setInterval}
        selectedInterval={selectedInterval}
        actions={invocationActions}
        totalInvocationCount={totalInvocationCount}
        totalErrorCount={totalErrorCount}
        totalWarningCount={totalWarningCount}
        isLoadingFunction={isLoadingFunction}
        isErrorFunction={isErrorFunction}
        functionError={functionError}
        isLoadingChart={combinedStatsResults.isLoading}
        isErrorChart={isErrorCombinedStats}
        chartErrorMessage={combinedStatsError?.message ?? 'Unknown error'}
        chartData={invocationChartData}
        onChartClick={() => {
          router.push(
            `/project/${projectRef}/functions/${functionSlug}/${
              isUnifiedLogsEnabled ? 'logs' : 'invocations'
            }${isUnifiedLogsEnabled ? '' : `?its=${startDate.toISOString()}`}`
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
        data={chartData}
        dateTimeFormat={dateTimeFormat}
        isLoading={combinedStatsResults.isLoading}
        isError={isErrorCombinedStats}
        errorMessage={combinedStatsError?.message ?? 'Unknown error'}
        averageExecutionTime={averageExecutionTime}
        maxExecutionTime={maxExecutionTime}
      />

      <EdgeFunctionUsageSection
        data={chartData}
        dateTimeFormat={dateTimeFormat}
        isLoading={combinedStatsResults.isLoading}
        isError={isErrorCombinedStats}
        errorMessage={combinedStatsError?.message ?? 'Unknown error'}
        averageCpuTime={averageCpuTime}
        maxCpuTime={maxCpuTime}
        averageMemoryUsage={averageMemoryUsage}
        totalHeapMemory={totalHeapMemory}
        totalExternalMemory={totalExternalMemory}
        totalMemoryByType={totalMemoryByType}
      />
    </>
  )
}

export default EdgeFunctionOverview
