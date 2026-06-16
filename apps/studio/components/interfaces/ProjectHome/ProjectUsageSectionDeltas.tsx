import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, cn, Loading } from 'ui'
import { Row } from 'ui-patterns'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import {
  computeSuccessAndNonSuccessRates,
  isServiceDisabled,
  sortServicesByTraffic,
  type LogsBarChartDatum,
} from './ProjectUsage.metrics'
import { useServiceHealthMetrics } from '@/components/interfaces/Observability/useServiceHealthMetrics'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { ChartIntervalDropdown } from '@/components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from '@/components/ui/Logs/logs.utils'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrack } from '@/lib/telemetry/track'

// The homepage usage cards only surface this subset of the services returned by
// the shared service-health endpoint, and the telemetry events are typed to match.
type HomeServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'

type ChartIntervalKey = '1hr' | '1day' | '7day'

const isChartIntervalKey = (value: string): value is ChartIntervalKey =>
  value === '1hr' || value === '1day' || value === '7day'

type ServiceEntry = {
  key: HomeServiceKey
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
}

export const ProjectUsageSectionDeltas = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const track = useTrack()
  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])
  const { getEntitlementMax } = useCheckEntitlements('log.retention_days')
  const retentionDays = getEntitlementMax()

  const DEFAULT_INTERVAL: ChartIntervalKey =
    retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day'
  const [interval, setSelectedInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)

  useEffect(() => {
    setSelectedInterval(retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day')
  }, [retentionDays])

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const { services: serviceData, isLoading } = useServiceHealthMetrics(
    projectRef ?? '',
    interval,
    0
  )

  // Functions is included here (and absent from the V2 chart) because the
  // service-health endpoint exposes per-function metrics that the legacy
  // usage.api-counts endpoint does not.
  const serviceBase: ServiceEntry[] = useMemo(
    () => [
      {
        key: 'db',
        title: 'Postgres',
        href: `/project/${projectRef}/editor`,
        route: '/logs/postgres-logs',
        enabled: true,
      },
      {
        key: 'functions',
        title: 'Edge Functions',
        route: '/logs/edge-functions-logs',
        enabled: true,
      },
      {
        key: 'auth',
        title: 'Auth',
        href: `/project/${projectRef}/auth/users`,
        route: '/logs/auth-logs',
        enabled: authEnabled,
      },
      {
        key: 'storage',
        title: 'Storage',
        href: `/project/${projectRef}/storage/buckets`,
        route: '/logs/storage-logs',
        enabled: storageEnabled,
      },
      {
        key: 'realtime',
        title: 'Realtime',
        route: '/logs/realtime-logs',
        enabled: true,
      },
    ],
    [projectRef, authEnabled, storageEnabled]
  )

  // Build per-service stats, then order them so the busiest services come first
  // and services with no data sink to the end (where they render disabled).
  const services: ServiceComputed[] = useMemo(() => {
    const computed = serviceBase
      .filter((s) => s.enabled)
      .map((s) => {
        const stats = serviceData[s.key]
        return {
          ...s,
          data: stats.eventChartData,
          total: stats.total,
          warn: stats.warningCount,
          err: stats.errorCount,
        }
      })

    return sortServicesByTraffic(computed)
  }, [serviceBase, serviceData])

  const totalRequests = services.reduce((sum, s) => sum + s.total, 0)
  const totalErrors = services.reduce((sum, s) => sum + s.err, 0)
  const totalWarnings = services.reduce((sum, s) => sum + s.warn, 0)

  const { successRate } = computeSuccessAndNonSuccessRates(
    totalRequests,
    totalWarnings,
    totalErrors
  )

  const handleBarClick =
    (logRoute: string, serviceKey: HomeServiceKey) => (datum: LogsBarChartDatum) => {
      if (!datum?.timestamp) return

      // datum.timestamp is the UTC bucket boundary from the endpoint, so scope the
      // log view to exactly that bucket's width.
      const unit = interval === '1hr' ? 'minute' : interval === '1day' ? 'hour' : 'day'
      const start = datum.timestamp
      const end = dayjs(datum.timestamp).add(1, unit).toISOString()

      const queryParams = new URLSearchParams({
        iso_timestamp_start: start,
        iso_timestamp_end: end,
      })

      router.push(`/project/${projectRef}${logRoute}?${queryParams.toString()}`)

      track('home_project_usage_chart_clicked', {
        service_type: serviceKey,
        bar_timestamp: datum.timestamp,
      })
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-x-2">
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{totalRequests.toLocaleString()}</span>
            <span>Total Requests</span>
          </div>
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{successRate.toFixed(1)}%</span>
            <span>Success Rate</span>
          </div>
        </div>
        <ChartIntervalDropdown
          value={interval}
          onChange={(next) => {
            if (isChartIntervalKey(next)) setSelectedInterval(next)
          }}
          organizationSlug={organization?.slug}
          dropdownAlign="end"
          tooltipSide="left"
        />
      </div>
      <Row maxColumns={4} minWidth={280}>
        {services.map((s) => {
          const disabled = isServiceDisabled(s.total, isLoading)
          return (
            <Card
              key={s.key}
              className={cn('mb-0 md:mb-0 flex flex-col h-64', disabled && 'opacity-60')}
            >
              <CardHeader className="flex flex-row items-end justify-between gap-2 space-y-0 pb-0 border-b-0">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <CardTitle className="text-xs font-mono uppercase text-foreground-light">
                      {s.href && !disabled ? (
                        <Link
                          href={s.href}
                          onClick={() => {
                            track('home_project_usage_service_clicked', {
                              service_type: s.key,
                              total_requests: s.total,
                              error_count: s.err,
                            })
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
                    onBarClick={disabled ? undefined : handleBarClick(s.route, s.key)}
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
          )
        })}
      </Row>
    </div>
  )
}
