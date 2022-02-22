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

import { get } from 'lib/common/fetch'
import { API_URL, METRICS, DATE_FORMAT } from 'lib/constants'
import { useFlag } from 'hooks'

const CHART_INTERVALS = [
  { key: 'minutely', label: '60 minutes', startValue: 1, startUnit: 'hour', format: 'MMM D, h:ma' },
  { key: 'hourly', label: '24 hours', startValue: 24, startUnit: 'hour', format: 'MMM D, ha' },
  { key: 'daily', label: '7 days', startValue: 7, startUnit: 'day', format: 'MMM D' },
]
interface Props {
  project: any
}

const ProjectUsage: FC<Props> = ({ project }) => {
  const logsUsageChartIntervals = useFlag('logsUsageChartIntervals')
  const [interval, setInterval] = useState<string>('hourly')
  const router = useRouter()
  const { ref } = router.query
  const { data, error }: any = useSWR(
    // only fetch when browser window is active
    `${API_URL}/projects/${ref}/log-stats?interval=${interval}`,
    get
    // increase refresh rate x10 to 30s when focus lost
    // conditional fetching will cause cached data to clear (not desirable)
    // { refreshInterval: isActive ? 3000 : 30000 }
  )
  const selectedInterval = logsUsageChartIntervals
    ? CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
    : CHART_INTERVALS[2]
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
      router.push(`/project/${ref}/settings/logs/api?te=${paddedTimestamp}`)
    } else {
      router.push(`/project/${ref}/settings/logs/api?te=${timestamp}`)
    }
  }
  return (
    <div className="mx-6 space-y-6">
      <div className="flex flex-row justify-between align-center w-full">
        <Typography.Title level={4}>Statistics for past {selectedInterval.label}</Typography.Title>

        {logsUsageChartIntervals && (
          <Dropdown
            side="bottom"
            align="end"
            overlay={
              <Dropdown.RadioGroup value={interval} onChange={setInterval}>
                {CHART_INTERVALS.map((i) => (
                  <Dropdown.Radio key={i.key} value={i.key}>
                    <Typography.Text>{i.label}</Typography.Text>
                  </Dropdown.Radio>
                ))}
              </Dropdown.RadioGroup>
            }
          >
            <Button type="text" iconRight={<IconChevronDown />}>
              {selectedInterval.label}
            </Button>
          </Dropdown>
        )}
      </div>
      <div className="">
        {startDate && endDate && (
          <div className="grid lg:grid-cols-4 lg:gap-8">
            <Panel key="database-chart">
              <Panel.Content className="space-y-4">
                <PanelHeader
                  icon={<IconDatabase size="small" />}
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
                <ProjectUsageMinimal
                  projectRef={project.ref}
                  subscription_id={project.subscription_id}
                  filter="Database"
                />
              </Panel.Content>
            </Panel>
            <Panel key="auth-chart">
              <Panel.Content className="space-y-4">
                <PanelHeader
                  icon={<IconKey size="small" />}
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
                <ProjectUsageMinimal
                  projectRef={project.ref}
                  subscription_id={project.subscription_id}
                  filter="Auth"
                />
              </Panel.Content>
            </Panel>
            <Panel key="storage-chart">
              <Panel.Content className="space-y-4">
                <PanelHeader
                  icon={<IconArchive size="small" />}
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
                <ProjectUsageMinimal
                  projectRef={project.ref}
                  subscription_id={project.subscription_id}
                  filter="File storage"
                />
              </Panel.Content>
            </Panel>
            <Panel key="realtime-chart">
              <Panel.Content className="space-y-4">
                <PanelHeader icon={<IconZap size="small" />} title="Realtime" />
                <ChartHandler
                  startDate={startDate}
                  endDate={endDate}
                  attribute={'total_realtime_requests'}
                  label={METRICS.find((x: any) => x.key == 'total_realtime_requests')?.label ?? ''}
                  provider="log-stats"
                  interval="1h"
                  hideChartType
                  customDateFormat={datetimeFormat}
                  data={charts}
                  isLoading={!charts && !error ? true : false}
                  onBarClick={(v) => handleBarClick(v, '/realtime')}
                />
                {/* Empty space just so the cards are of the same height */}
                <div className="py-[26px]" />
                {/* <ProjectUsageMinimal
                  projectRef={project.ref}
                  subscription_id={project.subscription_id}
                  filter="Connection requests"
                /> */}
              </Panel.Content>
            </Panel>
          </div>
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
          'flex items-center space-x-3 opacity-80 ' +
          (props.href ? 'cursor-pointer hover:opacity-100 hover:text-green-500' : '')
        }
      >
        <Typography.Text>{props.icon}</Typography.Text>
        <span className="flex items-center space-x-1">
          <Typography.Title level={4} className="mb-0">
            {props.title}
          </Typography.Title>
        </span>
      </div>
    </Tag>
  )
}
