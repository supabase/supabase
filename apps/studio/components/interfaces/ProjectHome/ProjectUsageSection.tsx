import { useParams } from 'common'
import dayjs from 'dayjs'
import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Row } from 'ui-patterns'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import { normalizeChartBuckets } from './ChartDataTransform.utils'
import type { LogsBarChartDatum } from './ProjectUsage.metrics'
import {
  computeSuccessAndNonSuccessRates,
  sumErrors,
  sumTotal,
  sumWarnings,
} from './ProjectUsage.metrics'
import { useServiceHealthMetrics } from '@/components/interfaces/Observability/useServiceHealthMetrics'
import { ChartIntervalDropdown } from '@/components/ui/Logs/ChartIntervalDropdown'
import { CHART_INTERVALS } from '@/components/ui/Logs/logs.utils'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

type ChartIntervalKey = '1hr' | '1day' | '7day'

type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'

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
  const { getEntitlementMax } = useCheckEntitlements('log.retention_days')
  const retentionDays = getEntitlementMax()

  const DEFAULT_INTERVAL: ChartIntervalKey =
    retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day'
  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)

  useEffect(() => {
    setInterval(retentionDays !== undefined && retentionDays < 7 ? '1hr' : '1day')
  }, [retentionDays])

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]

  const { datetimeFormat } = useMemo(() => {
    const format = selectedInterval.format || 'MMM D, ha'
    return { datetimeFormat: format }
  }, [selectedInterval])

  const {
    services: healthServices,
    isLoading: isHealthLoading,
    endDate,
  } = useServiceHealthMetrics(projectRef as string, interval, 0)

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
        const healthData = healthServices[s.key]
        const data = normalizeChartBuckets(healthData.eventChartData, interval, new Date(endDate))
        const total = sumTotal(data)
        const warn = sumWarnings(data)
        const err = sumErrors(data)

        return {
          ...s,
          data,
          total,
          warn,
          err,
          isLoading: healthData.isLoading,
          error: healthData.error,
        }
      }),
    [serviceBase, healthServices, interval, endDate]
  )

  const isLoading = isHealthLoading

  const handleBarClick =
    (logRoute: string, serviceKey: ServiceKey) => (datum: LogsBarChartDatum) => {
      if (!datum?.timestamp) return

      const unit = interval === '1hr' ? 'minute' : interval === '1day' ? 'hour' : 'day'
      const start = dayjs(datum.timestamp).toISOString()
      const end = dayjs(datum.timestamp).add(1, unit).toISOString()
      const queryParams = new URLSearchParams({ its: start, ite: end })

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
  const totalErrors = enabledServices.reduce((sum, s) => sum + (s.err || 0), 0)
  const totalWarnings = enabledServices.reduce((sum, s) => sum + (s.warn || 0), 0)
  const { successRate } = computeSuccessAndNonSuccessRates(
    totalRequests,
    totalWarnings,
    totalErrors
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-x-2">
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{totalRequests.toLocaleString()}</span>
            <span>Total Requests</span>
          </div>
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">
              {successRate === 100 ? '100' : successRate.toFixed(1)}%
            </span>
            <span>Success Rate</span>
          </div>
        </div>
        <ChartIntervalDropdown
          value={interval}
          onChange={(interval) => setInterval(interval as ChartIntervalKey)}
          organizationSlug={organization?.slug}
          dropdownAlign="end"
          tooltipSide="left"
        />
      </div>
      <Row maxColumns={4} minWidth={280}>
        {enabledServices.map((s) => (
          <Chart key={s.key} isLoading={isLoading} className="h-full">
            <ChartCard className="mb-0 md:mb-0 h-full flex flex-col h-64">
              <ChartHeader>
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
                            error_count: s.err || 0,
                          },
                          groups: {
                            project: projectRef,
                            organization: organization.slug,
                          },
                        })
                      }
                    }}
                  >
                    <ChartMetric label={s.title} value={(s.total || 0).toLocaleString()} />
                  </Link>
                ) : (
                  <ChartMetric label={s.title} value={(s.total || 0).toLocaleString()} />
                )}
                <div className="flex items-center gap-6">
                  <ChartMetric
                    label="Warn"
                    value={(s.warn || 0).toLocaleString()}
                    status="warning"
                    align="end"
                  />
                  <ChartMetric
                    label="Err"
                    value={(s.err || 0).toLocaleString()}
                    status="negative"
                    align="end"
                  />
                </div>
              </ChartHeader>
              <ChartContent
                className="flex-1 overflow-hidden"
                isEmpty={s.total === 0}
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2 size={16} />}
                    title="No data to show"
                    description="No requests for selected period"
                    className="h-full min-h-36"
                  />
                }
                loadingState={<ChartLoadingState className="h-full min-h-36" />}
              >
                <div className="h-full">
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
                  />
                </div>
              </ChartContent>
            </ChartCard>
          </Chart>
        ))}
      </Row>
    </div>
  )
}
