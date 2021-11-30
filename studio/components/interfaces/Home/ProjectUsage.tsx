import useSWR from 'swr'
import dayjs from 'dayjs'
import Link from 'next/link'
import { FC } from 'react'
import { useRouter } from 'next/router'
import { IconArchive, IconDatabase, IconKey, IconZap, Typography } from '@supabase/ui'

import Panel from 'components/to-be-cleaned/Panel'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import { ProjectUsageMinimal } from 'components/to-be-cleaned/Usage'

import { useIsActive } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, METRICS, DATE_FORMAT } from 'lib/constants'

const DATETIME_FORMAT = 'MMM D, ha'

interface Props {
  project: any
}

const ProjectUsage: FC<Props> = ({ project }) => {
  const router = useRouter()
  const { ref } = router.query
  const isActive = useIsActive()
  const { data, error }: any = useSWR(
    // only fetch when browser window is active
    `${API_URL}/projects/${ref}/log-stats`,
    get,
    // increase refresh rate x10 to 30s when focus lost
    // conditional fetching will cause cached data to clear (not desirable)
    // { refreshInterval: isActive ? 3000 : 30000 }
  )
  const startDate = dayjs().subtract(7, 'day').format(DATE_FORMAT)
  const endDate = dayjs().format(DATE_FORMAT)
  const charts = data?.data

  return (
    <div className="mx-6 space-y-6">
      <Typography.Title level={4}>Statistics for past 24 hours</Typography.Title>
      <div className="">
        {startDate && endDate && (
          <div className="grid lg:grid-cols-4 lg:gap-8">
            <Panel key="database-chart">
              <Panel.Content className="space-y-4">
                <PanelHeader
                  icon={<IconDatabase size="small" />}
                  title="Database"
                  href={'/project/[ref]/editor/table'}
                  as={`/project/${ref}/editor/table`}
                />
                <ChartHandler
                  startDate={startDate}
                  endDate={endDate}
                  attribute={'total_rest_requests'}
                  label={METRICS.find((x: any) => x.key == 'total_rest_requests')?.label ?? ''}
                  provider="log-stats"
                  interval="1d"
                  hideChartType
                  customDateFormat={DATETIME_FORMAT}
                  data={charts}
                  isLoading={!charts && !error ? true : false}
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
                  href={'/project/[ref]/auth/users'}
                  as={`/project/${ref}/auth/users`}
                />
                <ChartHandler
                  startDate={startDate}
                  endDate={endDate}
                  attribute={'total_auth_requests'}
                  label={METRICS.find((x) => x.key == 'total_auth_requests')?.label ?? ''}
                  provider="log-stats"
                  interval="1d"
                  hideChartType
                  customDateFormat={DATETIME_FORMAT}
                  data={charts}
                  isLoading={!charts && !error ? true : false}
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
                  href={'/project/[ref]/storage/buckets'}
                  as={`/project/${ref}/storage/buckets`}
                />
                <ChartHandler
                  startDate={startDate}
                  endDate={endDate}
                  attribute={'total_storage_requests'}
                  label={METRICS.find((x) => x.key == 'total_storage_requests')?.label ?? ''}
                  provider="log-stats"
                  interval="1d"
                  hideChartType
                  customDateFormat={DATETIME_FORMAT}
                  data={charts}
                  isLoading={!charts && !error ? true : false}
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
                  customDateFormat={DATETIME_FORMAT}
                  data={charts}
                  isLoading={!charts && !error ? true : false}
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
    <Tag href={props.href} as={props.as}>
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
