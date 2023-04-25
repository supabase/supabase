import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { checkPermissions } from 'hooks'
import { useParams } from 'common/hooks'
import { ChartIntervals, NextPageWithLayout } from 'types'
import { DATE_FORMAT } from 'lib/constants'
import NoPermission from 'components/ui/NoPermission'
import FunctionsLayout from 'components/layouts/FunctionsLayout'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import { useFunctionsInvStatsQuery } from 'data/analytics/functions-inv-stats-query'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import BarChart from 'components/ui/Charts/BarChart'
import AreaChart from 'components/ui/Charts/AreaChart'
import { isUnixMicro, unixMicroToIsoTimestamp } from 'components/interfaces/Settings/Logs'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '5min',
    label: '5 min',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  { key: '15min', label: '15 min', startValue: 24, startUnit: 'hour', format: 'MMM D, ha' },
  { key: '1hr', label: '1 hour', startValue: 7, startUnit: 'day', format: 'MMM D' },
  { key: '1day', label: '1 day', startValue: 7, startUnit: 'day', format: 'MMM D' },
  { key: '7day', label: '7 days', startValue: 7, startUnit: 'day', format: 'MMM D' },
]

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()

  const [interval, setInterval] = useState<string>('15min')
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]

  const { data: selectedFunction } = useEdgeFunctionQuery({ projectRef, slug: functionSlug })
  const id = selectedFunction?.id

  const { data, error } = useFunctionsInvStatsQuery({
    projectRef,
    functionId: id,
    interval: selectedInterval.key,
  })
  const isChartLoading = !data?.result && !error ? true : false
  console.log(isChartLoading)
  const chartData = useMemo(() => {
    return (data?.result || []).map((d: any) => ({
      ...d,
      timestamp: isUnixMicro(d.timestamp) ? unixMicroToIsoTimestamp(d.timestamp) : d.timestamp,
    }))
  }, [data?.result])

  const startDate = dayjs()
    .subtract(selectedInterval.startValue, selectedInterval.startUnit)
    .format(DATE_FORMAT)
  const endDate = dayjs().format(DATE_FORMAT)

  const canReadFunction = checkPermissions(PermissionAction.FUNCTIONS_READ, functionSlug as string)
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

        <span className="text-xs text-scale-1000">
          Statistics for past {selectedInterval.label}
        </span>
      </div>
      <div className="">
        {startDate && endDate && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-2 lg:gap-8">
              <ReportWidget
                title="Execution time"
                tooltip="Average execution time of function invocations"
                data={chartData}
                isLoading={isChartLoading}
                renderer={(props) => (
                  <AreaChart
                    className="w-full"
                    xAxisKey="timestamp"
                    yAxisKey="avg_execution_time"
                    data={props.data}
                    format="ms"
                    highlightedValue={meanBy(props.data, 'avg_execution_time')}
                  />
                )}
              />
              <ReportWidget
                title="Invocations"
                data={chartData}
                isLoading={isChartLoading}
                renderer={(props) => (
                  <BarChart
                    className="w-full"
                    xAxisKey="timestamp"
                    yAxisKey="count"
                    data={props.data}
                    highlightedValue={sumBy(props.data, 'count')}
                    onBarClick={(v) => {
                      router.push(
                        `/project/${projectRef}/functions/${functionSlug}/invocations?ite=${v.timestamp}`
                      )
                    }}
                  />
                )}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
