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
import { EndpointResponse, PathsDatum, StatusCodesDatum } from './ChartData.types'

const CHART_INTERVALS = [
  { key: 'minutely', label: '60 minutes', startValue: 1, startUnit: 'hour', format: 'MMM D, h:mma' },
  { key: 'hourly', label: '24 hours', startValue: 24, startUnit: 'hour', format: 'MMM D, ha' },
  { key: 'daily', label: '7 days', startValue: 7, startUnit: 'day', format: 'MMM D' },
]
interface Props {
  project: any
}

const ProjectUsage: FC<Props> = ({ project }) => {
  const logsUsageCodesPaths = useFlag('logsUsageCodesPaths')
  const logsUsageChartIntervals = useFlag('logsUsageChartIntervals')
  const [interval, setInterval] = useState<string>('hourly')
  const router = useRouter()
  const { ref } = router.query
  const { data, error }: any = useSWR(
    `${API_URL}/projects/${ref}/log-stats?interval=${interval}`,
    get
  )
  const { data: codesData, error: codesFetchError } = useSWR<EndpointResponse<StatusCodesDatum>>(
    logsUsageCodesPaths
      ? `${API_URL}/projects/${ref}/analytics/endpoints/usage.api-codes?interval=${interval}`
      : null,
    get
  )

  const { data: pathsData, error: _pathsFetchError }: any = useSWR<EndpointResponse<PathsDatum>>(
    logsUsageCodesPaths
      ? `${API_URL}/projects/${ref}/analytics/endpoints/usage.api-paths?interval=${interval}`
      : null,
    get
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
      <div className="flex flex-row items-center gap-2">
        {logsUsageChartIntervals && (
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
        )}
        <span className="text-scale-1000 text-xs">
          Statistics for past {selectedInterval.label}
        </span>
      </div>
      <div className="">
        {startDate && endDate && (
          <>
            <div className="grid grid-cols-1 md:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              <Panel key="database-chart">
                <Panel.Content className="space-y-4">
                  <PanelHeader
                    icon={
                      <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
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
                    icon={
                      <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
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
                    icon={
                      <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
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
                  <ProjectUsageMinimal
                    projectRef={project.ref}
                    subscription_id={project.subscription_id}
                    filter="File storage"
                  />
                </Panel.Content>
              </Panel>
              <Panel key="realtime-chart">
                <Panel.Content className="space-y-4">
                  <PanelHeader
                    icon={
                      <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
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
                  <div className="py-[1.64rem]" />
                </Panel.Content>
              </Panel>
            </div>
          </>
        )}
        {logsUsageCodesPaths && (
          <div className="grid md:gap-4 lg:grid-cols-4 lg:gap-8">
            <Panel
              key="api-status-codes"
              className="col-start-1 col-span-2"
              wrapWithLoading={false}
            >
              <Panel.Content className="space-y-4">
                <PanelHeader title="API Status Codes" />
                <StackedAreaChart
                  dateFormat={datetimeFormat}
                  data={codesData?.result}
                  stackKey="status_code"
                  xAxisKey="timestamp"
                  yAxisKey="count"
                  isLoading={!codesData && !codesFetchError ? true : false}
                  xAxisFormatAsDate
                  size="large"
                  styleMap={{
                    200: { stroke: USAGE_COLORS['200'], fill: USAGE_COLORS['200'] },
                    201: { stroke: USAGE_COLORS['201'], fill: USAGE_COLORS['201'] },
                    400: { stroke: USAGE_COLORS['400'], fill: USAGE_COLORS['400'] },
                    401: { stroke: USAGE_COLORS['401'], fill: USAGE_COLORS['401'] },
                    404: { stroke: USAGE_COLORS['404'], fill: USAGE_COLORS['404'] },
                    500: { stroke: USAGE_COLORS['500'], fill: USAGE_COLORS['500'] },
                  }}
                />
              </Panel.Content>
            </Panel>
            <Panel
              key="top-routes"
              className="col-start-3 col-span-2 pb-0"
              bodyClassName="h-full"
              wrapWithLoading={false}
            >
              <Panel.Content className="space-y-4">
                <PanelHeader title="Top Routes" />
                <Table
                  head={
                    <>
                      <Table.th>Path</Table.th>
                      <Table.th>Count</Table.th>
                      <Table.th>Avg. Latency (ms)</Table.th>
                    </>
                  }
                  body={
                    <>
                      {(pathsData?.result ?? []).map((row: PathsDatum) => (
                        <Table.tr>
                          <Table.td className="flex items-center space-x-2">
                            <p className="font-mono text-sm text-scale-1200">{row.method}</p>
                            <p className="font-mono text-sm">{row.path}</p>
                          </Table.td>
                          <Table.td>{row.count}</Table.td>
                          <Table.td>{Number(row.avg_origin_time).toFixed(2)}</Table.td>
                        </Table.tr>
                      ))}
                    </>
                  }
                />
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
