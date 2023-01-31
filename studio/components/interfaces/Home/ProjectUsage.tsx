import useSWR from 'swr'
import dayjs from 'dayjs'
import Link from 'next/link'
import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import { Button, Dropdown, IconArchive, IconChevronDown, IconDatabase, IconKey, IconZap } from 'ui'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import Panel from 'components/ui/Panel'
import { get } from 'lib/common/fetch'
import { API_URL, DATE_FORMAT, METRICS } from 'lib/constants'
import { ChartIntervals } from 'types'

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: 'minutely',
    label: '60 minutes',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  { key: 'hourly', label: '24 hours', startValue: 24, startUnit: 'hour', format: 'MMM D, ha' },
  { key: 'daily', label: '7 days', startValue: 7, startUnit: 'day', format: 'MMM D' },
]
interface Props {}

const ProjectUsage: FC<Props> = ({}) => {
  const router = useRouter()
  const { ref } = router.query

  const [interval, setInterval] = useState<string>('hourly')

  const { data, error }: any = useSWR(
    `${API_URL}/projects/${ref}/log-stats?interval=${interval}`,
    get
  )

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const startDate = dayjs()
    .subtract(selectedInterval.startValue, selectedInterval.startUnit)
    .format(DATE_FORMAT)
  const endDate = dayjs().format(DATE_FORMAT)
  const charts = data?.data
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
      router.push(`/project/${ref}/logs/edge-logs?te=${paddedTimestamp}`)
    } else {
      router.push(`/project/${ref}/logs/edge-logs?te=${timestamp}`)
    }
  }

  return (
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
        <span className="text-xs text-scale-1000">
          Statistics for past {selectedInterval.label}
        </span>
      </div>
      <div className="">
        {startDate && endDate && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-4 lg:gap-8">
              <Panel key="database-chart">
                <Panel.Content className="space-y-4">
                  <PanelHeader
                    icon={
                      <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                        <IconDatabase strokeWidth={2} size={16} />
                      </div>
                    }
                    title="Database"
                    href={`/project/${ref}/editor`}
                  />
                  <ChartHandler
                    startDate={startDate}
                    endDate={endDate}
                    attribute={'total_rest_requests'}
                    label={METRICS.find((x: any) => x.key == 'total_rest_requests')?.label ?? ''}
                    provider="log-stats"
                    interval="1d"
                    hideChartType
                    customDateFormat={datetimeFormat}
                    data={charts}
                    isLoading={!charts && !error ? true : false}
                    onBarClick={(v) => handleBarClick(v, '/rest')}
                  />
                </Panel.Content>
              </Panel>
              <Panel key="auth-chart">
                <Panel.Content className="space-y-4">
                  <PanelHeader
                    icon={
                      <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                        <IconKey strokeWidth={2} size={16} />
                      </div>
                    }
                    title="Auth"
                    href={`/project/${ref}/auth/users`}
                  />
                  <ChartHandler
                    startDate={startDate}
                    endDate={endDate}
                    attribute={'total_auth_requests'}
                    label={METRICS.find((x) => x.key == 'total_auth_requests')?.label ?? ''}
                    provider="log-stats"
                    interval="1d"
                    hideChartType
                    customDateFormat={datetimeFormat}
                    data={charts}
                    isLoading={!charts && !error ? true : false}
                    onBarClick={(v) => handleBarClick(v, '/auth')}
                  />
                </Panel.Content>
              </Panel>
              <Panel key="storage-chart">
                <Panel.Content className="space-y-4">
                  <PanelHeader
                    icon={
                      <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                        <IconArchive strokeWidth={2} size={16} />
                      </div>
                    }
                    title="Storage"
                    href={`/project/${ref}/storage/buckets`}
                  />
                  <ChartHandler
                    startDate={startDate}
                    endDate={endDate}
                    attribute={'total_storage_requests'}
                    label={METRICS.find((x) => x.key == 'total_storage_requests')?.label ?? ''}
                    provider="log-stats"
                    interval="1d"
                    hideChartType
                    customDateFormat={datetimeFormat}
                    data={charts}
                    isLoading={!charts && !error ? true : false}
                    onBarClick={(v) => handleBarClick(v, '/storage')}
                  />
                </Panel.Content>
              </Panel>
              <Panel key="realtime-chart">
                <Panel.Content className="space-y-4">
                  <PanelHeader
                    icon={
                      <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                        <IconZap strokeWidth={2} size={16} />
                      </div>
                    }
                    title="Realtime"
                  />
                  <ChartHandler
                    startDate={startDate}
                    endDate={endDate}
                    attribute={'total_realtime_requests'}
                    label={
                      METRICS.find((x: any) => x.key == 'total_realtime_requests')?.label ?? ''
                    }
                    provider="log-stats"
                    interval="1h"
                    hideChartType
                    customDateFormat={datetimeFormat}
                    data={charts}
                    isLoading={!charts && !error ? true : false}
                    onBarClick={(v) => handleBarClick(v, '/realtime')}
                  />
                </Panel.Content>
              </Panel>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
export default ProjectUsage

const PanelHeader = (props: any) => {
  const Tag = props?.href ? Link : 'div'
  return (
    <Tag href={props.href}>
      <div
        className={
          'flex items-center space-x-3 opacity-80 transition ' +
          (props.href ? 'cursor-pointer hover:text-gray-1200 hover:opacity-100' : '')
        }
      >
        <p>{props.icon}</p>
        <span className="flex items-center space-x-1">
          <h4 className="mb-0 text-lg">{props.title}</h4>
        </span>
      </div>
    </Tag>
  )
}
