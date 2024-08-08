import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs, { Dayjs } from 'dayjs'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import AreaChart from 'components/ui/Charts/AreaChart'
import StackedBarChart from 'components/ui/Charts/StackedBarChart'
import NoPermission from 'components/ui/NoPermission'
import { useFunctionsReqStatsQuery } from 'data/analytics/functions-req-stats-query'
import { useFunctionsResourceUsageQuery } from 'data/analytics/functions-resource-usage-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { ChartIntervals, NextPageWithLayout } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '5min',
    label: '5 min',
    startValue: 5,
    startUnit: 'minute',
    format: 'MMM D, h:mm:ssa',
  },
  {
    key: '15min',
    label: '15 min',
    startValue: 15,
    startUnit: 'minute',
    format: 'MMM D, h:mma',
  },
  {
    key: '1hr',
    label: '1 hour',
    startValue: 1,
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
  {
    key: '7day',
    label: '7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D',
  },
]

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const [interval, setInterval] = useState<string>('15min')
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const { data: selectedFunction } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })
  const id = selectedFunction?.id

  const reqStatsResult = useFunctionsReqStatsQuery({
    projectRef,
    functionId: id,
    interval: selectedInterval.key,
  })

  const resourceUsageResult = useFunctionsResourceUsageQuery({
    projectRef,
    functionId: id,
    interval: selectedInterval.key,
  })

  const reqStatsData = useMemo(() => {
    const result = reqStatsResult.data?.result
    return result || []
  }, [reqStatsResult.data])

  const resourceUsageData = useMemo(() => {
    return resourceUsageResult.data?.result || []
  }, [resourceUsageResult.data])

  const [startDate, endDate]: [Dayjs, Dayjs] = useMemo(() => {
    const start = dayjs()
      .subtract(selectedInterval.startValue, selectedInterval.startUnit as dayjs.ManipulateType)
      .startOf(selectedInterval.startUnit as dayjs.ManipulateType)

    const end = dayjs().startOf(selectedInterval.startUnit as dayjs.ManipulateType)
    return [start, end]
  }, [selectedInterval])

  const {
    data: execTimeChartData,
    error: execTimeError,
    isError: isErrorExecTime,
  } = useFillTimeseriesSorted(
    reqStatsData,
    'timestamp',
    ['avg_execution_time'],
    0,
    startDate.toISOString(),
    endDate.toISOString()
  )

  const {
    data: invocationsChartData,
    error: invocationsError,
    isError: isErrorInvocations,
  } = useFillTimeseriesSorted(
    reqStatsData,
    'timestamp',
    ['count', 'success_count', 'redirect_count', 'client_err_count', 'server_err_count'],
    0,
    startDate.toISOString(),
    endDate.toISOString()
  )

  const {
    data: resourceUsageChartData,
    error: resourceUsageError,
    isError: isErrorResourceUsage,
  } = useFillTimeseriesSorted(
    resourceUsageData,
    'timestamp',
    ['avg_cpu_time_used', 'avg_memory_used'],
    0,
    startDate.toISOString(),
    endDate.toISOString()
  )

  const canReadFunction = useCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    functionSlug as string
  )
  if (!canReadFunction) {
    return <NoPermission isFullPage resourceText="access this edge function" />
  }
  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-row items-center gap-2">
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
            data={execTimeChartData}
            isLoading={reqStatsResult.isLoading}
            renderer={(props) => {
              return isErrorExecTime ? (
                <Alert_Shadcn_ variant="warning">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Failed to reterieve execution time</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>{execTimeError.message}</AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              ) : (
                <AreaChart
                  className="w-full"
                  xAxisKey="timestamp"
                  customDateFormat={selectedInterval.format}
                  yAxisKey="avg_execution_time"
                  data={props.data}
                  format="ms"
                  highlightedValue={meanBy(props.data, 'avg_execution_time')}
                />
              )
            }}
          />
          <ReportWidget
            title="Invocations"
            data={invocationsChartData}
            isLoading={reqStatsResult.isLoading}
            renderer={(props) => {
              if (isErrorInvocations) {
                return (
                  <Alert_Shadcn_ variant="warning">
                    <WarningIcon />
                    <AlertTitle_Shadcn_>Failed to reterieve invocations</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>{invocationsError.message}</AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                )
              } else {
                const data = props.data
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

                return (
                  <StackedBarChart
                    className="w-full"
                    xAxisKey="timestamp"
                    yAxisKey="count"
                    stackKey="status"
                    data={data}
                    highlightedValue={sumBy(data, 'count')}
                    customDateFormat={selectedInterval.format}
                    stackColors={['brand', 'slate', 'yellow', 'red']}
                    onBarClick={() => {
                      router.push(
                        `/project/${projectRef}/functions/${functionSlug}/invocations?its=${startDate.toISOString()}`
                      )
                    }}
                  />
                )
              }
            }}
          />
          <ReportWidget
            title="CPU time"
            tooltip="Average CPU time usage for the function"
            data={resourceUsageChartData}
            isLoading={resourceUsageResult.isLoading}
            renderer={(props) => {
              return isErrorResourceUsage ? (
                <Alert_Shadcn_ variant="warning">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Failed to retrieve CPU time</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>{resourceUsageError.message}</AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              ) : (
                <AreaChart
                  className="w-full"
                  xAxisKey="timestamp"
                  customDateFormat={selectedInterval.format}
                  yAxisKey="avg_cpu_time_used"
                  data={props.data}
                  format="ms"
                  highlightedValue={meanBy(props.data, 'avg_cpu_time_used')}
                />
              )
            }}
          />
          <ReportWidget
            title="Memory"
            tooltip="Average memory usage for the function"
            data={resourceUsageChartData}
            isLoading={resourceUsageResult.isLoading}
            renderer={(props) => {
              return isErrorResourceUsage ? (
                <Alert_Shadcn_ variant="warning">
                  <WarningIcon />
                  <AlertTitle_Shadcn_>Failed to retrieve memory usage</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>{resourceUsageError.message}</AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              ) : (
                <AreaChart
                  className="w-full"
                  xAxisKey="timestamp"
                  customDateFormat={selectedInterval.format}
                  yAxisKey="avg_memory_used"
                  data={props.data}
                  format="MB"
                  highlightedValue={meanBy(props.data, 'avg_memory_used')}
                />
              )
            }}
          />
        </div>
      </div>
    </div>
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default PageLayout
