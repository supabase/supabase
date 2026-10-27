import { IS_PLATFORM, useFeatureFlags, useFlag, useParams } from 'common'
import maxBy from 'lodash/maxBy'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle, LogoLoader, WarningIcon } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { EdgeFunctionIntervalSelector } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionIntervalSelector'
import { EdgeFunctionOverview } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview'
import {
  EDGE_FUNCTION_CHART_INTERVALS,
  getRollingTimeRange,
} from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { EdgeFunctionOverviewHeader } from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverviewHeader'
import { EdgeFunctionRecentInvocations } from '@/components/interfaces/Functions/EdgeFunctionRecentInvocations'
import ReportWidget from '@/components/interfaces/Reports/ReportWidget'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from '@/components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import AreaChart from '@/components/ui/Charts/AreaChart'
import StackedBarChart from '@/components/ui/Charts/StackedBarChart'
import { NoPermission } from '@/components/ui/NoPermission'
import {
  FunctionsCombinedStatsVariables,
  useFunctionsCombinedStatsQuery,
} from '@/data/analytics/functions-combined-stats-query'
import { useEdgeFunctionQuery } from '@/data/edge-functions/edge-function-query'
import { useFillTimeseriesSorted } from '@/hooks/analytics/useFillTimeseriesSorted'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'
import type { NextPageWithLayout } from '@/types'

const LegacyEdgeFunctionOverview = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()

  const [interval, setInterval] = useState<string>('1hr')
  const selectedInterval =
    EDGE_FUNCTION_CHART_INTERVALS.find((i) => i.key === interval) ||
    EDGE_FUNCTION_CHART_INTERVALS[1]
  const { data: selectedFunction } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })
  const id = selectedFunction?.id
  const combinedStatsResults = useFunctionsCombinedStatsQuery({
    projectRef,
    functionId: id,
    interval: selectedInterval.key as FunctionsCombinedStatsVariables['interval'],
  })

  const combinedStatsData = useMemo(() => {
    const result = combinedStatsResults.data?.result as
      | Record<string, string | number>[]
      | undefined
    return result || []
  }, [combinedStatsResults.data])

  const [startDate] = useMemo(
    () =>
      getRollingTimeRange(
        selectedInterval,
        new Date(combinedStatsResults.dataUpdatedAt || Date.now())
      ),
    [selectedInterval, combinedStatsResults.dataUpdatedAt]
  )

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
  })

  const { isLoading: permissionsLoading, can: canReadFunction } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ
  )
  if (!canReadFunction && !permissionsLoading) {
    return <NoPermission isFullPage resourceText="access this edge function" />
  }

  return (
    <>
      <EdgeFunctionOverviewHeader
        actions={
          <EdgeFunctionIntervalSelector interval={interval} onIntervalChange={setInterval} />
        }
      />
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            {IS_PLATFORM && id && (
              <div className="mb-8">
                <EdgeFunctionRecentInvocations
                  functionId={id}
                  functionSlug={functionSlug as string}
                />
              </div>
            )}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-2 lg:gap-8">
                <ReportWidget
                  title="Execution time"
                  tooltip="Average execution time of function invocations"
                  data={combinedStatsChartData}
                  isLoading={combinedStatsResults.isLoading}
                  renderer={(props) => {
                    return isErrorCombinedStats ? (
                      <Alert variant="warning">
                        <WarningIcon />
                        <AlertTitle>Failed to reterieve execution time</AlertTitle>
                        <AlertDescription>
                          {combinedStatsError?.message ?? 'Unknown error'}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-8">
                        <AreaChart
                          title="Average execution time"
                          className="w-full"
                          xAxisKey="timestamp"
                          customDateFormat={selectedInterval.format}
                          yAxisKey="avg_execution_time"
                          data={props.data}
                          format="ms"
                          highlightedValue={meanBy(props.data, 'avg_execution_time')}
                        />
                        <AreaChart
                          title="Max execution time"
                          className="w-full"
                          xAxisKey="timestamp"
                          customDateFormat={selectedInterval.format}
                          yAxisKey="max_execution_time"
                          data={props.data}
                          format="ms"
                          highlightedValue={
                            maxBy(props.data, 'max_execution_time')?.max_execution_time
                          }
                        />
                      </div>
                    )
                  }}
                />
                <ReportWidget
                  title="Invocations"
                  tooltip="Requests made to a function are considered invocations, and each invocation may have worker logs."
                  data={combinedStatsChartData}
                  isLoading={combinedStatsResults.isLoading}
                  renderer={(props) => {
                    if (isErrorCombinedStats) {
                      return (
                        <Alert variant="warning">
                          <WarningIcon />
                          <AlertTitle>Failed to reterieve invocations</AlertTitle>
                          <AlertDescription>
                            {combinedStatsError?.message ?? 'Unknown error'}
                          </AlertDescription>
                        </Alert>
                      )
                    } else {
                      const requestData = props.data
                        .map((d: any) => [
                          {
                            status: '2xx',
                            count: d.success_count,
                            timestamp: d.timestamp,
                          },
                          {
                            status: '3xx',
                            count: d.redirect_count,
                            timestamp: d.timestamp,
                          },
                          {
                            status: '4xx',
                            count: d.client_err_count,
                            timestamp: d.timestamp,
                          },
                          {
                            status: '5xx',
                            count: d.server_err_count,
                            timestamp: d.timestamp,
                          },
                        ])
                        .flat()

                      const logsData = props.data
                        .map((d: any) => [
                          {
                            status: 'error',
                            count: d.log_error_count,
                            timestamp: d.timestamp,
                          },
                          {
                            status: 'info',
                            count: d.log_info_count,
                            timestamp: d.timestamp,
                          },
                          {
                            status: 'warn',
                            count: d.log_warn_count,
                            timestamp: d.timestamp,
                          },
                        ])
                        .flat()

                      return (
                        <div className="space-y-8">
                          <StackedBarChart
                            title="Invocation Requests"
                            className="w-full"
                            xAxisKey="timestamp"
                            yAxisKey="count"
                            stackKey="status"
                            data={requestData}
                            highlightedValue={sumBy(requestData, 'count')}
                            customDateFormat={selectedInterval.format}
                            stackColors={['brand', 'slate', 'yellow', 'red']}
                            onBarClick={() => {
                              router.push(
                                `/project/${projectRef}/functions/${functionSlug}/invocations?its=${startDate.toISOString()}`
                              )
                            }}
                          />
                          <StackedBarChart
                            title="Worker Logs"
                            className="w-full"
                            xAxisKey="timestamp"
                            yAxisKey="count"
                            stackKey="status"
                            data={logsData}
                            highlightedValue={sumBy(logsData, 'count')}
                            customDateFormat={selectedInterval.format}
                            stackColors={['red', 'brand', 'yellow']}
                            onBarClick={() => {
                              router.push(
                                `/project/${projectRef}/functions/${functionSlug}/logs?its=${startDate.toISOString()}`
                              )
                            }}
                          />
                        </div>
                      )
                    }
                  }}
                />
                <ReportWidget
                  title="CPU time"
                  tooltip="Average CPU time usage for the function"
                  data={combinedStatsChartData}
                  isLoading={combinedStatsResults.isLoading}
                  renderer={(props) => {
                    return isErrorCombinedStats ? (
                      <Alert variant="warning">
                        <WarningIcon />
                        <AlertTitle>Failed to retrieve CPU time</AlertTitle>
                        <AlertDescription>
                          {combinedStatsError?.message ?? 'Unknown error'}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-8">
                        <AreaChart
                          title="Average CPU Time"
                          className="w-full"
                          xAxisKey="timestamp"
                          customDateFormat={selectedInterval.format}
                          yAxisKey="avg_cpu_time_used"
                          data={props.data}
                          format="ms"
                          highlightedValue={meanBy(props.data, 'avg_cpu_time_used')}
                        />
                        <AreaChart
                          title="Max CPU Time"
                          className="w-full"
                          xAxisKey="timestamp"
                          customDateFormat={selectedInterval.format}
                          yAxisKey="max_cpu_time_used"
                          data={props.data}
                          format="ms"
                          highlightedValue={
                            maxBy(props.data, 'max_cpu_time_used')?.max_cpu_time_used
                          }
                        />
                      </div>
                    )
                  }}
                />
                <ReportWidget
                  title="Memory"
                  tooltip="Average memory usage for the function"
                  data={combinedStatsChartData}
                  isLoading={combinedStatsResults.isLoading}
                  renderer={(props) => {
                    if (isErrorCombinedStats) {
                      return (
                        <Alert variant="warning">
                          <WarningIcon />
                          <AlertTitle>Failed to retrieve memory usage</AlertTitle>
                          <AlertDescription>
                            {combinedStatsError?.message ?? 'Unknown error'}
                          </AlertDescription>
                        </Alert>
                      )
                    }

                    const memoryData = props.data
                      .map((d: any) => [
                        {
                          type: 'heap',
                          count: d.avg_heap_memory_used,
                          timestamp: d.timestamp,
                        },
                        {
                          type: 'external',
                          count: d.avg_external_memory_used,
                          timestamp: d.timestamp,
                        },
                      ])
                      .flat()

                    return (
                      <div className="space-y-8">
                        <AreaChart
                          title="Average Memory Usage"
                          className="w-full"
                          xAxisKey="timestamp"
                          customDateFormat={selectedInterval.format}
                          yAxisKey="avg_memory_used"
                          data={props.data}
                          format="MB"
                          highlightedValue={meanBy(props.data, 'avg_memory_used')}
                        />
                        <StackedBarChart
                          title="Average Memory Usage by Type"
                          className="w-full"
                          xAxisKey="timestamp"
                          yAxisKey="count"
                          stackKey="type"
                          format="MB"
                          data={memoryData}
                          highlightedValue={sumBy(memoryData, 'count')}
                          customDateFormat={selectedInterval.format}
                          stackColors={['blue', 'brand']}
                        />
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

const PageLayout: NextPageWithLayout = () => {
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const showNewOverview = useFlag('edgeFunctionsOverview') === true

  if (IS_PLATFORM && !flagsLoaded) {
    return <LogoLoader />
  }

  if (showNewOverview) {
    return <EdgeFunctionOverview />
  }

  return <LegacyEdgeFunctionOverview />
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Overview">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default PageLayout
