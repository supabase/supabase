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
import { CHART_INTERVALS } from 'components/ui/Charts/Charts.constants'
interface Props {
  project: any
}

const ProjectUsage: FC<Props> = ({ project }) => {
  const [interval, setInterval] = useState<string>('hourly')
  const router = useRouter()
  const { ref } = router.query
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
      router.push(`/project/${ref}/database/api-logs?te=${paddedTimestamp}`)
    } else {
      router.push(`/project/${ref}/database/api-logs?te=${timestamp}`)
    }
  }
  return (
    <div className="mx-6 space-y-6">
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
