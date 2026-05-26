import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, cn, Loading } from 'ui'
import { Row } from 'ui-patterns'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import {
  computeChangePercent,
  computeSuccessAndNonSuccessRates,
  formatDelta,
  sumErrors,
  sumTotal,
  sumWarnings,
  type LogsBarChartDatum,
} from './ProjectUsage.metrics'
import { useServiceStats, type ServiceKey } from './ProjectUsageSection.utils'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { ChartIntervalDropdown } from '@/components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from '@/components/ui/Logs/logs.utils'
import type { ProjectMetricsInterval } from '@/data/analytics/project-metrics-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const INTERVAL_VALUES: readonly ProjectMetricsInterval[] = [
  '15min',
  '1hr',
  '3hr',
  '1day',
  '3day',
  '7day',
]

const isProjectMetricsInterval = (value: string): value is ProjectMetricsInterval =>
  (INTERVAL_VALUES as readonly string[]).includes(value)

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
  warn: number
  err: number
  prevTotal: number
  isLoading: boolean
  error: unknown | null
}

export const ProjectUsageSectionDeltas = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])
  const { getEntitlementMax } = useCheckEntitlements('log.retention_days')
  const retentionDays = getEntitlementMax()

  const DEFAULT_INTERVAL: ProjectMetricsInterval =
    retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day'
  const [interval, setSelectedInterval] = useState<ProjectMetricsInterval>(DEFAULT_INTERVAL)

  useEffect(() => {
    setSelectedInterval(retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day')
  }, [retentionDays])

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const statsByService = useServiceStats(projectRef, interval)

  // Functions is included here (and absent from the V2 chart) because the
  // project.metrics endpoint exposes per-function metrics that the legacy
  // usage.api-counts endpoint does not.
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
        key: 'functions',
        title: 'Functions requests',
        route: '/logs/edge-functions-logs',
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
        const currentStats = statsByService[s.key].current
        const previousStats = statsByService[s.key].previous
        const data = currentStats.eventChartData
        return {
          ...s,
          data,
          total: sumTotal(data),
          warn: sumWarnings(data),
          err: sumErrors(data),
          prevTotal: sumTotal(previousStats.eventChartData),
          isLoading: currentStats.isLoading,
          error: currentStats.error,
        }
      }),
    [serviceBase, statsByService]
  )

  const isLoading = services.some((s) => s.isLoading)

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
  const totalRequests = enabledServices.reduce((sum, s) => sum + s.total, 0)
  const totalErrors = enabledServices.reduce((sum, s) => sum + s.err, 0)
  const totalWarnings = enabledServices.reduce((sum, s) => sum + s.warn, 0)
  const prevTotalRequests = enabledServices.reduce((sum, s) => sum + s.prevTotal, 0)

  const { successRate, nonSuccessRate } = computeSuccessAndNonSuccessRates(
    totalRequests,
    totalWarnings,
    totalErrors
  )
  const totalChangePct = computeChangePercent(totalRequests, prevTotalRequests)
  const totalDeltaClass = totalChangePct >= 0 ? 'text-brand-link' : 'text-destructive'
  const nonSuccessClass = nonSuccessRate > 0 ? 'text-destructive' : 'text-brand-link'

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-x-2">
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{totalRequests.toLocaleString()}</span>
            <span>Total Requests</span>
            <span className={cn('text-sm', totalDeltaClass)}>{formatDelta(totalChangePct)}</span>
          </div>
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{successRate.toFixed(1)}%</span>
            <span>Success Rate</span>
            <span className={cn('text-sm', nonSuccessClass)}>
              {nonSuccessRate.toFixed(1)}% errors
            </span>
          </div>
        </div>
        <ChartIntervalDropdown
          value={interval}
          onChange={(next) => {
            if (isProjectMetricsInterval(next)) setSelectedInterval(next)
          }}
          organizationSlug={organization?.slug}
          dropdownAlign="end"
          tooltipSide="left"
        />
      </div>
      <Row maxColumns={4} minWidth={280}>
        {enabledServices.map((s) => (
          <Card key={s.key} className="mb-0 md:mb-0 flex flex-col h-64">
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
                                total_requests: s.total,
                                error_count: s.err,
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
                  <span className="text-foreground text-xl">{s.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-end gap-4 text-foreground-light">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                    <span className="heading-meta">Warn</span>
                  </div>
                  <span className="text-foreground text-base">{s.warn.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                    <span className="heading-meta">Err</span>
                  </div>
                  <span className="text-foreground text-base">{s.err.toLocaleString()}</span>
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
                    error_count: { label: 'Errors' },
                    warning_count: { label: 'Warnings' },
                    ok_count: { label: 'Requests' },
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
