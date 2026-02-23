import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useFlag, useParams } from 'common'
import { EdgeFunctionRecentInvocations } from 'components/interfaces/Functions/EdgeFunctionRecentInvocations'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import AreaChart from 'components/ui/Charts/AreaChart'
import StackedBarChart from 'components/ui/Charts/StackedBarChart'
import NoPermission from 'components/ui/NoPermission'
import {
  FunctionsCombinedStatsVariables,
  useFunctionsCombinedStatsQuery,
} from 'data/analytics/functions-combined-stats-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import dayjs, { Dayjs } from 'dayjs'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import maxBy from 'lodash/maxBy'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import type { ChartIntervals, NextPageWithLayout } from 'types'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '15min',
    label: '15 min',
    startValue: 15,
    startUnit: 'minute',
    format: 'MMM D, h:mm:ssa',
  },
  {
    key: '1hr',
    label: '1 hour',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '3hr',
    label: '3 hours',
    startValue: 3,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '1day',
    label: '1 day',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
]

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()

  const newChartsEnabled = useFlag('newEdgeFunctionOverviewCharts')
  const [interval, setInterval] = useState<string>('15min')
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
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

  const [startDate, endDate]: [Dayjs, Dayjs] = useMemo(() => {
    const start = dayjs()
      .subtract(selectedInterval.startValue, selectedInterval.startUnit as dayjs.ManipulateType)
      .startOf(selectedInterval.startUnit as dayjs.ManipulateType)

    const end = dayjs().startOf(selectedInterval.startUnit as dayjs.ManipulateType)
    return [start, end]
  }, [selectedInterval])

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

  const { isLoading: permissionsLoading, can: canReadFunction } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    functionSlug as string
  )
  if (!canReadFunction && !permissionsLoading) {
    return <NoPermission isFullPage resourceText="access this edge function" />
  }

  return (
    <PageContainer size="full">
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
          <div className="flex flex-row items-center gap-2 mb-4">
            <div className="flex items-center">
              {CHART_INTERVALS.map((item, i) => {
                const classes = []

                if (i === 0) {
                  classes.push('rounded-tr-none rounded-br-none')
                } else if (i === CHART_INTERVALS.length - 1) {
                  classes.push('rounded-tl-none rounded-bl-none')
                } else {
                  classes.push('rounded-none')
                }

                return (
                  <Button
                    key={`function-filter-${i}`}
                    type={interval === item.key ? 'secondary' : 'default'}
                    onClick={() => setInterval(item.key)}
                    className={classes.join(' ')}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </div>

            <span className="text-xs text-foreground-light">
              Statistics for past {selectedInterval.label}
            </span>
          </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-2 lg:gap-8">
              <ReportWidget
                title="Execution time"
                tooltip="Average execution time of function invocations"
                data={combinedStatsChartData}
                isLoading={combinedStatsResults.isLoading}
                renderer={(props) => {
                  return isErrorCombinedStats ? (
                    <Alert_Shadcn_ variant="warning">
                      <WarningIcon />
                      <AlertTitle_Shadcn_>Failed to reterieve execution time</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        {combinedStatsError?.message ?? 'Unknown error'}
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
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
                      {newChartsEnabled && (
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
                      )}
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
                      <Alert_Shadcn_ variant="warning">
                        <WarningIcon />
                        <AlertTitle_Shadcn_>Failed to reterieve invocations</AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          {combinedStatsError?.message ?? 'Unknown error'}
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
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
                        {newChartsEnabled && (
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
                        )}
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
                    <Alert_Shadcn_ variant="warning">
                      <WarningIcon />
                      <AlertTitle_Shadcn_>Failed to retrieve CPU time</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        {combinedStatsError?.message ?? 'Unknown error'}
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
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
                      {newChartsEnabled && (
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
                      )}
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
                      <Alert_Shadcn_ variant="warning">
                        <WarningIcon />
                        <AlertTitle_Shadcn_>Failed to retrieve memory usage</AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          {combinedStatsError?.message ?? 'Unknown error'}
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
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
                      {newChartsEnabled && (
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
                      )}
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout>{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default PageLayout
