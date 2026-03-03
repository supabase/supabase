import { useParams } from 'common'
import BarChart from 'components/ui/Charts/BarChart'
import { ChartIntervalDropdown } from 'components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from 'components/ui/Logs/logs.utils'
import Panel from 'components/ui/Panel'
import {
  ProjectLogStatsVariables,
  UsageApiCounts,
  useProjectLogStatsQuery,
} from 'data/analytics/project-log-stats-query'
import dayjs from 'dayjs'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Auth, Database, Realtime, Storage } from 'icons'
import sumBy from 'lodash/sumBy'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Loading } from 'ui'

type ChartIntervalKey = ProjectLogStatsVariables['interval']

const ProjectUsage = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])

  const { plan } = useCurrentOrgPlan()

  const DEFAULT_INTERVAL: ChartIntervalKey = plan?.id === 'free' ? '1hr' : '1day'

  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)

  const { data, isPending: isLoading } = useProjectLogStatsQuery({ projectRef, interval })

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const startDateLocal = dayjs().subtract(
    selectedInterval.startValue,
    selectedInterval.startUnit as dayjs.ManipulateType
  )
  const endDateLocal = dayjs()
  const { data: charts } = useFillTimeseriesSorted({
    data: data?.result ?? [],
    timestampKey: 'timestamp',
    valueKey: [
      'total_auth_requests',
      'total_rest_requests',
      'total_storage_requests',
      'total_realtime_requests',
    ],
    defaultValue: 0,
    startDate: startDateLocal.toISOString(),
    endDate: endDateLocal.toISOString(),
    minPointsToFill: 5,
  })
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const handleBarClick = (
    value: UsageApiCounts,
    _type: 'rest' | 'realtime' | 'storage' | 'auth'
  ) => {
    const unit = selectedInterval.startUnit
    const selectedStart = dayjs(value?.timestamp)
    const selectedEnd = selectedStart.add(1, unit)

    if (_type === 'rest') {
      router.push(
        `/project/${projectRef}/logs/edge-logs?its=${selectedStart.toISOString()}&ite=${selectedEnd.toISOString()}`
      )
      return
    }

    router.push(
      `/project/${projectRef}/logs/edge-logs?its=${selectedStart.toISOString()}&ite=${selectedEnd.toISOString()}&f=${JSON.stringify(
        {
          product: {
            [_type]: true,
          },
        }
      )}`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center gap-x-2">
        <ChartIntervalDropdown
          value={interval || '1day'}
          onChange={(interval) => setInterval(interval as ProjectLogStatsVariables['interval'])}
          planId={plan?.id}
          planName={plan?.name}
          organizationSlug={organization?.slug}
          dropdownAlign="start"
          tooltipSide="right"
        />
        <span className="text-xs text-foreground-light">
          Statistics for {selectedInterval.label.toLowerCase()}
        </span>
      </div>
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-4 @2xl:grid-cols-4">
        <Panel className="mb-0">
          <Panel.Content className="space-y-4">
            <PanelHeader
              icon={
                <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                  <Database strokeWidth={1.5} size={16} />
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
        {authEnabled && (
          <Panel className="mb-0 md:mb-0">
            <Panel.Content className="space-y-4">
              <PanelHeader
                icon={
                  <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                    <Auth strokeWidth={1.5} size={16} />
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
        )}
        {storageEnabled && (
          <Panel className="mb-0 md:mb-0">
            <Panel.Content className="space-y-4">
              <PanelHeader
                icon={
                  <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                    <Storage strokeWidth={1.5} size={16} />
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
        )}
        <Panel className="mb-0 md:mb-0">
          <Panel.Content className="space-y-4">
            <PanelHeader
              icon={
                <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                  <Realtime strokeWidth={1.5} size={16} />
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
