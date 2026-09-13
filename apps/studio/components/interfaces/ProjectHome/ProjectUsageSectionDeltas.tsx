import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, cn, Loading } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { Row } from 'ui-patterns/Row'

import {
  buildSortedServiceCards,
  computeSuccessAndNonSuccessRates,
  getBucketLogRange,
  isServiceDisabled,
  type ChartIntervalKey,
  type LogsBarChartDatum,
} from './ProjectUsage.metrics'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useServiceHealthMetrics } from '@/components/interfaces/Observability/useServiceHealthMetrics'
import {
  buildUnifiedLogsUrl,
  type UnifiedLogType,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { ChartIntervalDropdown } from '@/components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from '@/components/ui/Logs/logs.utils'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrack } from '@/lib/telemetry/track'

// Services the homepage shows; matches the telemetry event types.
type HomeServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime' | 'data_api'

const isChartIntervalKey = (value: string): value is ChartIntervalKey =>
  value === '1hr' || value === '1day' || value === '7day'

type ServiceEntry = {
  key: HomeServiceKey
  title: string
  href?: string
  route: string
  logType: UnifiedLogType
  enabled: boolean
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
  const { isEnabled: dataApiEnabled } = useIsDataApiEnabled({ projectRef })
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()
  const { getEntitlementMax } = useCheckEntitlements('log.retention_days')
  const retentionDays = getEntitlementMax()

  const [userInterval, setUserInterval] = useState<ChartIntervalKey | undefined>(undefined)
  const interval: ChartIntervalKey =
    userInterval ?? (retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day')

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  const { services: serviceData, isLoading } = useServiceHealthMetrics(
    projectRef ?? '',
    interval,
    0
  )

  const serviceBase: ServiceEntry[] = useMemo(
    () => [
      {
        key: 'db',
        title: 'Postgres',
        href: `/project/${projectRef}/editor`,
        route: '/logs/postgres-logs',
        logType: 'postgres',
        enabled: true,
      },
      {
        key: 'functions',
        title: 'Edge Functions',
        href: `/project/${projectRef}/functions`,
        route: '/logs/edge-functions-logs',
        logType: 'edge function',
        enabled: true,
      },
      {
        key: 'auth',
        title: 'Auth',
        href: `/project/${projectRef}/auth/users`,
        route: '/logs/auth-logs',
        logType: 'auth',
        enabled: authEnabled,
      },
      {
        key: 'storage',
        title: 'Storage',
        href: `/project/${projectRef}/storage/buckets`,
        route: '/logs/storage-logs',
        logType: 'storage',
        enabled: storageEnabled,
      },
      {
        key: 'realtime',
        title: 'Realtime',
        href: `/project/${projectRef}/realtime/inspector`,
        route: '/logs/realtime-logs',
        logType: 'realtime',
        enabled: true,
      },
      {
        key: 'data_api',
        title: 'API Gateway',
        href: `/project/${projectRef}/integrations/data_api/overview`,
        route: '/logs/edge-logs',
        logType: 'edge',
        enabled: dataApiEnabled,
      },
    ],
    [projectRef, authEnabled, storageEnabled, dataApiEnabled]
  )

  const services = useMemo(
    () => buildSortedServiceCards(serviceBase, serviceData),
    [serviceBase, serviceData]
  )

  const totalRequests = services.reduce((sum, s) => sum + s.total, 0)
  const totalErrors = services.reduce((sum, s) => sum + s.err, 0)
  const totalWarnings = services.reduce((sum, s) => sum + s.warn, 0)

  const { successRate } = computeSuccessAndNonSuccessRates(
    totalRequests,
    totalWarnings,
    totalErrors
  )

  const handleBarClick = (service: ServiceEntry) => (datum: LogsBarChartDatum) => {
    if (!datum?.timestamp) return

    const { start, end } = getBucketLogRange(datum.timestamp, interval)

    if (isUnifiedLogsEnabled) {
      router.push(
        buildUnifiedLogsUrl({ projectRef: projectRef!, logType: service.logType, start, end })
      )
    } else {
      // Logs explorer reads the range from `its`/`ite` (iso_timestamp_start/end
      // only set the label).
      const queryParams = new URLSearchParams({ its: start, ite: end })
      router.push(`/project/${projectRef}${service.route}?${queryParams.toString()}`)
    }

    track('home_project_usage_chart_clicked', {
      service_type: service.key,
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
            if (isChartIntervalKey(next)) setUserInterval(next)
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
                      <span className="heading-meta">Warnings</span>
                    </div>
                    <span className="text-foreground text-base">{s.warn.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                      <span className="heading-meta">Errors</span>
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
                    onBarClick={disabled ? undefined : handleBarClick(s)}
                    hideZeroValues={true}
                    chartConfig={{
                      error_count: { label: 'Errors' },
                      warning_count: { label: 'Warnings' },
                      ok_count: { label: 'Infos' },
                    }}
                    EmptyState={
                      isLoading ? (
                        <></>
                      ) : (
                        <NoDataPlaceholder
                          size="small"
                          message="No data for selected period"
                          isFullHeight
                        />
                      )
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
