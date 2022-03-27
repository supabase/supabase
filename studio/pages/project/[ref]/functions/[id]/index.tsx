import { observer } from 'mobx-react-lite'
import { withAuth } from 'hooks'

// import FunctionLayout from './../interfaces/FunctionLayout'

// const PageLayout = () => {
//   return <FunctionLayout>Metrics</FunctionLayout>
// }

import useSWR from 'swr'
import dayjs from 'dayjs'
import Link from 'next/link'
import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import {
  IconArchive,
  IconDatabase,
  IconKey,
  IconZap,
  Typography,
  Button,
  Dropdown,
  IconChevronDown,
} from '@supabase/ui'

import Panel from 'components/to-be-cleaned/Panel'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import { ProjectUsageMinimal } from 'components/to-be-cleaned/Usage'

import { useFlag } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, METRICS, DATE_FORMAT } from 'lib/constants'
import Table from 'components/to-be-cleaned/Table'
import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'
import { USAGE_COLORS } from 'components/ui/Charts/Charts.constants'
import {
  EndpointResponse,
  PathsDatum,
  StatusCodesDatum,
} from 'components/interfaces/Home/ChartData.types'
import FunctionLayout from '../interfaces/FunctionLayout'
// import { EndpointResponse, PathsDatum, StatusCodesDatum } from ' ChartData.types'

const CHART_INTERVALS = [
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

  var total = 0
  var count = 0

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

const PageLayout = () => {
  const [interval, setInterval] = useState<string>('15min')
  const router = useRouter()
  const { ref, id } = router.query

  const url = `${API_URL}/projects/${ref}/analytics/endpoints/functions.inv-stats`

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  console.log('selectInterval', selectedInterval)

  const { data, error }: any = useSWR(
    `${url}?interval=${selectedInterval.key}&function_id=${id}`,
    get
  )
  console.log('data', data)

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

  return (
    <FunctionLayout>
      <div className="space-y-6">
        <div className="flex flex-row items-center gap-2">
          <Dropdown
            side="bottom"
            align="start"
            overlay={
              <Dropdown.RadioGroup value={interval} onChange={setInterval}>
                {CHART_INTERVALS.map((i) => (
                  <Dropdown.Radio key={i.key} value={i.key}>
                    {i.label}
                  </Dropdown.Radio>
                ))}
              </Dropdown.RadioGroup>
            }
          >
            <Button as="span" type="default" iconRight={<IconChevronDown />}>
              {selectedInterval.label}
            </Button>
          </Dropdown>

          <span className="text-scale-1000 text-xs">
            Statistics for past {selectedInterval.label}
          </span>
        </div>
        <div className="">
          {startDate && endDate && (
            <>
              <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2 lg:grid-cols-2 lg:gap-8">
                <Panel key="database-chart">
                  <Panel.Content className="space-y-4">
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
                      highlightedValue={calculateHighlightedValue(
                        data?.result,
                        'avg_execution_time'
                      )}
                      // onBarClick={(v) => handleBarClick(v, '/rest')}
                    />
                  </Panel.Content>
                </Panel>
                <Panel key="auth-chart">
                  <Panel.Content className="space-y-4">
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
            </>
          )}
        </div>
      </div>
    </FunctionLayout>
  )
}
// export default ProjectUsage

const PanelHeader = (props: any) => {
  const Tag = props?.href ? Link : 'div'
  return (
    <Tag href={props.href}>
      <div
        className={
          'flex items-center space-x-3 opacity-80 transition ' +
          (props.href ? 'cursor-pointer hover:opacity-100 hover:text-gray-1200' : '')
        }
      >
        <Typography.Text>{props.icon}</Typography.Text>
        <span className="flex items-center space-x-1">
          <h4 className="mb-0 text-lg">{props.title}</h4>
        </span>
      </div>
    </Tag>
  )
}

export default withAuth(observer(PageLayout))
