import dayjs from 'dayjs'
import Link from 'next/link'
import { FC, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Button,
  Dropdown,
  IconArchive,
  IconChevronDown,
  IconDatabase,
  IconKey,
  IconZap,
  Loading,
} from 'ui'
import Panel from 'components/ui/Panel'
import { ChartIntervals } from 'types'
import { useParams } from 'common/hooks'
import { UsageApiCounts, useProjectLogStatsQuery } from 'data/analytics/project-log-stats-query'
import BarChart from 'components/ui/Charts/BarChart'
import sumBy from 'lodash/sumBy'
import useFillTimeseriesSorted from 'hooks/analytics/useFillTimeseriesSorted'

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
  const { ref: projectRef } = useParams()

  const [interval, setInterval] = useState<string>('hourly')

  const { data, error, isLoading } = useProjectLogStatsQuery({ projectRef, interval })

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const startDateLocal = dayjs().subtract(
    selectedInterval.startValue,
    selectedInterval.startUnit as dayjs.ManipulateType
  )
  const endDateLocal = dayjs()
  const charts = useFillTimeseriesSorted(
    data?.result || [],
    'timestamp',
    [
      'total_auth_requests',
      'total_rest_requests',
      'total_storage_requests',
      'total_realtime_requests',
    ],
    0,
    startDateLocal.toISOString(),
    endDateLocal.toISOString()
  )
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const handleBarClick = (
    value: UsageApiCounts,
    // TODO (ziinc): link to edge logs with correct filter applied
    _type: 'rest' | 'realtime' | 'storage' | 'auth'
  ) => {
    const selected = dayjs(value?.timestamp).toISOString()
    router.push(`/project/${projectRef}/logs/edge-logs?ite=${encodeURIComponent(selected)}`)
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
          <Button asChild type="default" iconRight={<IconChevronDown />}>
            <span>{selectedInterval.label}</span>
          </Button>
        </Dropdown>
        <span className="text-xs text-scale-1000">
          Statistics for past {selectedInterval.label}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 lg:grid-cols-4 lg:gap-8">
        <Panel>
          <Panel.Content className="space-y-4">
            <PanelHeader
              icon={
                <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                  <IconDatabase strokeWidth={2} size={16} />
                </div>
              }
              title="Database"
              href={`/project/${projectRef}/editor`}
            />

            <Loading active={isLoading}>
              <BarChart
                title="REST Requests"
                data={charts}
                xAxisKey="timestamp"
                yAxisKey="total_rest_requests"
                onBarClick={(v: unknown) => handleBarClick(v as UsageApiCounts, 'rest')}
                customDateFormat={datetimeFormat}
                highlightedValue={sumBy(charts, 'total_rest_requests')}
              />
            </Loading>
          </Panel.Content>
        </Panel>
        <Panel>
          <Panel.Content className="space-y-4">
            <PanelHeader
              icon={
                <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                  <IconKey strokeWidth={2} size={16} />
                </div>
              }
              title="Auth"
              href={`/project/${projectRef}/auth/users`}
            />
            <Loading active={isLoading}>
              <BarChart
                title="Auth Requests"
                data={charts}
                xAxisKey="timestamp"
                yAxisKey="total_auth_requests"
                onBarClick={(v: unknown) => handleBarClick(v as UsageApiCounts, 'auth')}
                customDateFormat={datetimeFormat}
                highlightedValue={sumBy(charts || [], 'total_auth_requests')}
              />
            </Loading>
          </Panel.Content>
        </Panel>
        <Panel>
          <Panel.Content className="space-y-4">
            <PanelHeader
              icon={
                <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                  <IconArchive strokeWidth={2} size={16} />
                </div>
              }
              title="Storage"
              href={`/project/${projectRef}/storage/buckets`}
            />

            <Loading active={isLoading}>
              <BarChart
                title="Storage Requests"
                data={charts}
                xAxisKey="timestamp"
                yAxisKey="total_storage_requests"
                onBarClick={(v: unknown) => handleBarClick(v as UsageApiCounts, 'storage')}
                customDateFormat={datetimeFormat}
                highlightedValue={sumBy(charts, 'total_storage_requests')}
              />
            </Loading>
          </Panel.Content>
        </Panel>
        <Panel>
          <Panel.Content className="space-y-4">
            <PanelHeader
              icon={
                <div className="rounded bg-scale-600 p-1.5 text-scale-1000 shadow-sm">
                  <IconZap strokeWidth={2} size={16} />
                </div>
              }
              title="Realtime"
            />

            <Loading active={isLoading}>
              <BarChart
                title="Realtime Requests"
                data={charts}
                xAxisKey="timestamp"
                yAxisKey="total_realtime_requests"
                onBarClick={(v: unknown) => handleBarClick(v as UsageApiCounts, 'realtime')}
                customDateFormat={datetimeFormat}
                highlightedValue={sumBy(charts, 'total_realtime_requests')}
              />
            </Loading>
          </Panel.Content>
        </Panel>
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
        <div>{props.icon}</div>
        <span className="flex items-center space-x-1">
          <h4 className="mb-0 text-lg">{props.title}</h4>
        </span>
      </div>
    </Tag>
  )
}
