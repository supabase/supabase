import { useParams } from 'common'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { ChartIntervalDropdown } from 'components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from 'components/ui/Logs/logs.utils'
import {
  ProjectLogStatsVariables,
  UsageApiCounts,
  useProjectLogStatsQuery,
} from 'data/analytics/project-log-stats-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import dayjs from 'dayjs'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Loading } from 'ui'
import { Row } from 'ui-patterns'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  ok_count: number
  warning_count: number
}

type ChartIntervalKey = '1hr' | '1day' | '7day'

type ServiceKey = 'db' | 'auth' | 'storage' | 'realtime'

type ServiceEntry = {
  key: ServiceKey
  title: string
  href?: string
  route: string
  enabled: boolean
}

type ServiceComputed = ServiceEntry & {
  data: LogsBarChartDatum[]
  total: number
  isLoading: boolean
  error: unknown | null
}

export const ProjectUsageSection = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])
  const { plan } = useCurrentOrgPlan()

  const DEFAULT_INTERVAL: ChartIntervalKey = plan?.id === 'free' ? '1hr' : '1day'
  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]

  const { datetimeFormat } = useMemo(() => {
    const format = selectedInterval.format || 'MMM D, ha'
    return { datetimeFormat: format }
  }, [selectedInterval])

  // Use V1 data fetching
  const { data: logStatsData, isPending: isLoading } = useProjectLogStatsQuery({
    projectRef,
    interval,
  })

  // Calculate date range for gap filling
  const startDateLocal = dayjs().subtract(
    selectedInterval.startValue,
    selectedInterval.startUnit as dayjs.ManipulateType
  )
  const endDateLocal = dayjs()

  // Fill gaps in timeseries data
  const { data: filledCharts } = useFillTimeseriesSorted({
    data: logStatsData?.result ?? [],
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

  const serviceBase: ServiceEntry[] = useMemo(
    () => [
      {
        key: 'db',
        title: 'Database requests',
        href: `/project/${projectRef}/editor`,
        route: '/logs/postgres-logs',
        enabled: true,
      },
      {
        key: 'auth',
        title: 'Auth requests',
        href: `/project/${projectRef}/auth/users`,
        route: '/logs/auth-logs',
        enabled: authEnabled,
      },
      {
        key: 'storage',
        title: 'Storage requests',
        href: `/project/${projectRef}/storage/buckets`,
        route: '/logs/storage-logs',
        enabled: storageEnabled,
      },
      {
        key: 'realtime',
        title: 'Realtime requests',
        route: '/logs/realtime-logs',
        enabled: true,
      },
    ],
    [projectRef, authEnabled, storageEnabled]
  )

  const services: ServiceComputed[] = useMemo(
    () =>
      serviceBase.map((s) => {
        // Map service keys to V1 data field names
        const dataKeyMap: Record<ServiceKey, keyof UsageApiCounts> = {
          db: 'total_rest_requests',
          auth: 'total_auth_requests',
          storage: 'total_storage_requests',
          realtime: 'total_realtime_requests',
        }

        const dataKey = dataKeyMap[s.key]

        // Transform V1 data to LogsBarChart format
        // Since V1 doesn't have error/warning breakdown, we show everything as "ok"
        const transformedData: LogsBarChartDatum[] = (filledCharts || []).map((item) => ({
          timestamp: item.timestamp,
          error_count: 0,
          warning_count: 0,
          ok_count: Number(item[dataKey]) || 0,
        }))

        // Calculate total from filled data
        const total = transformedData.reduce((sum, item) => sum + item.ok_count, 0)

        return {
          ...s,
          data: transformedData,
          total,
          isLoading,
          error: null,
        }
      }),
    [serviceBase, filledCharts, isLoading]
  )

  const handleBarClick =
    (logRoute: string, serviceKey: ServiceKey) => (datum: LogsBarChartDatum) => {
      if (!datum?.timestamp) return

      const datumTimestamp = dayjs(datum.timestamp).toISOString()
      const start = dayjs(datumTimestamp).subtract(1, 'minute').toISOString()
      const end = dayjs(datumTimestamp).add(1, 'minute').toISOString()

      const queryParams = new URLSearchParams({
        iso_timestamp_start: start,
        iso_timestamp_end: end,
      })

      router.push(`/project/${projectRef}${logRoute}?${queryParams.toString()}`)

      if (projectRef && organization?.slug) {
        sendEvent({
          action: 'home_project_usage_chart_clicked',
          properties: {
            service_type: serviceKey,
            bar_timestamp: datum.timestamp,
          },
          groups: {
            project: projectRef,
            organization: organization.slug,
          },
        })
      }
    }

  const enabledServices = services.filter((s) => s.enabled)
  const totalRequests = enabledServices.reduce((sum, s) => sum + (s.total || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-x-2">
        <div className="flex items-start gap-2 heading-section text-foreground-light">
          <span className="text-foreground">{totalRequests.toLocaleString()}</span>
          <span>Total Requests</span>
        </div>
        <ChartIntervalDropdown
          value={interval}
          onChange={(interval) => setInterval(interval as ChartIntervalKey)}
          planId={plan?.id}
          planName={plan?.name}
          organizationSlug={organization?.slug}
          dropdownAlign="end"
          tooltipSide="left"
        />
      </div>
      <Row columns={[3, 2, 1]}>
        {enabledServices.map((s) => (
          <Card key={s.key} className="mb-0 md:mb-0 h-full flex flex-col h-64">
            <CardHeader className="flex flex-row items-end justify-between gap-2 space-y-0 pb-0 border-b-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <CardTitle className="text-xs font-mono uppercase text-foreground-light">
                    {s.href ? (
                      <Link
                        href={s.href}
                        onClick={() => {
                          if (projectRef && organization?.slug) {
                            sendEvent({
                              action: 'home_project_usage_service_clicked',
                              properties: {
                                service_type: s.key,
                                total_requests: s.total || 0,
                              },
                              groups: {
                                project: projectRef,
                                organization: organization.slug,
                              },
                            })
                          }
                        }}
                      >
                        {s.title}
                      </Link>
                    ) : (
                      s.title
                    )}
                  </CardTitle>
                  <span className="text-foreground text-xl">{(s.total || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-card flex-1 h-full overflow-hidden">
              <Loading isFullHeight active={isLoading}>
                <LogsBarChart
                  isFullHeight
                  data={s.data}
                  DateTimeFormat={datetimeFormat}
                  onBarClick={handleBarClick(s.route, s.key)}
                  hideZeroValues={true}
                  chartConfig={{
                    error_count: {
                      label: 'Errors',
                    },
                    warning_count: {
                      label: 'Warnings',
                    },
                    ok_count: {
                      label: 'Requests',
                    },
                  }}
                  EmptyState={
                    <NoDataPlaceholder
                      size="small"
                      message="No data for selected period"
                      isFullHeight
                    />
                  }
                />
              </Loading>
            </CardContent>
          </Card>
        ))}
      </Row>
    </div>
  )
}
