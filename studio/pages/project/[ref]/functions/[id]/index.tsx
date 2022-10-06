import useSWR from 'swr'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from 'ui'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions } from 'hooks'
import { ChartIntervals, NextPageWithLayout } from 'types'
import { get } from 'lib/common/fetch'
import { API_URL, DATE_FORMAT } from 'lib/constants'
import Panel from 'components/ui/Panel'
import NoPermission from 'components/ui/NoPermission'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import FunctionsLayout from 'components/layouts/FunctionsLayout'

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

function calculateHighlightedValue(array: any, attribute: string, options?: { sum: boolean }) {
  if (!array) return ''

  let total = 0
  let count = 0

  array.forEach(function (item: any, index: number) {
    const _item = item[attribute]
    total += _item
    count++
  })

  if (options?.sum) {
    return total
  } else {
    return total / count
  }
}

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref, id } = router.query

  const [interval, setInterval] = useState<string>('15min')

  const url = `${API_URL}/projects/${ref}/analytics/endpoints/functions.inv-stats`
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]

  const { data, error }: any = useSWR(
    `${url}?interval=${selectedInterval.key}&function_id=${id}`,
    get
  )

  const startDate = dayjs()
    .subtract(selectedInterval.startValue, selectedInterval.startUnit)
    .format(DATE_FORMAT)
  const endDate = dayjs().format(DATE_FORMAT)

  const charts: any = {}
  charts.data = data?.result

  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const handleBarClick = (v: any, search: string) => {
    if (!v || !v.activePayload?.[0]?.payload) return
    // returns rechart internal tooltip data type
    const payload = v.activePayload[0].payload
    const timestamp = payload.timestamp
    const timestampDigits = String(timestamp).length
    if (timestampDigits < 16) {
      // pad unix timestamp with additional 0 and then forward
      const paddedTimestamp = String(timestamp) + '0'.repeat(16 - timestampDigits)
      router.push(`/project/${ref}/functions/${id}/logs?te=${paddedTimestamp}`)
    } else {
      router.push(`/project/${ref}/functions/${id}/logs?te=${timestamp}`)
    }
  }

  const canReadFunction = checkPermissions(PermissionAction.FUNCTIONS_READ, id as string)
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
              <Panel key="database-chart">
                <Panel.Content className="space-y-4">
                  {/*
                    // @ts-ignore */}
                  <ChartHandler
                    label="Execution time"
                    defaultChartStyle="line"
                    startDate={startDate}
                    endDate={endDate}
                    attribute={'avg_execution_time'}
                    provider="log-stats"
                    // interval="1d"
                    hideChartType
                    customDateFormat={datetimeFormat}
                    data={charts}
                    format="ms"
                    isLoading={!charts.data && !error ? true : false}
                    highlightedValue={calculateHighlightedValue(data?.result, 'avg_execution_time')}
                    // onBarClick={(v) => handleBarClick(v, '/rest')}
                  />
                </Panel.Content>
              </Panel>
              <Panel key="invocation-chart">
                <Panel.Content className="space-y-4">
                  {/*
                    {/*
                  {/*
                    // @ts-ignore */}
                  <ChartHandler
                    label="Invocations"
                    startDate={startDate}
                    endDate={endDate}
                    attribute={'count'}
                    provider="log-stats"
                    // interval="1d"
                    hideChartType
                    customDateFormat={datetimeFormat}
                    data={charts}
                    isLoading={!charts.data && !error ? true : false}
                    highlightedValue={calculateHighlightedValue(data?.result, 'count', {
                      sum: true,
                    })}
                    onBarClick={(v) => handleBarClick(v, '/auth')}
                  />
                </Panel.Content>
              </Panel>
            </div>
            {/* <Panel key="error-chart">
              <Panel.Content className="space-y-4">
                <ChartHandler
                  defaultChartStyle="line"
                  label="Error count"
                  startDate={startDate}
                  endDate={endDate}
                  attribute={'min_execution_time'}
                  provider="log-stats"
                  // interval="1d"
                  hideChartType
                  customDateFormat={datetimeFormat}
                  data={charts}
                  isLoading={!charts.data && !error ? true : false}
                  highlightedValue={calculateHighlightedValue(data?.result, 'min_execution_time', {
                    sum: true,
                  })}
                  onBarClick={(v) => handleBarClick(v, '/auth')}
                />
              </Panel.Content>
            </Panel> */}
          </>
        )}
      </div>
    </div>
  )
}

PageLayout.getLayout = (page) => <FunctionsLayout>{page}</FunctionsLayout>

export default observer(PageLayout)
