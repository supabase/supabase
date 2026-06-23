import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, cn, Loading } from 'ui'
import { Row } from 'ui-patterns'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'

import {
  buildSortedServiceCards,
  getBucketLogRange,
  isServiceDisabled,
  type ChartIntervalKey,
  type LogsBarChartDatum,
} from './ProjectUsage.metrics'
import { ApiGatewayProductChart } from '@/components/interfaces/Observability/ApiGatewayProductChart'
import {
  buildApiGatewayProductData,
  calculateApiGatewayAggregate,
} from '@/components/interfaces/Observability/apiGatewayProductChart.utils'
import { useServiceHealthMetrics } from '@/components/interfaces/Observability/useServiceHealthMetrics'
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
      {
        key: 'data_api',
        title: 'API Gateway',
        route: '/logs/edge-logs',
        enabled: dataApiEnabled,
      },
    ],
    [projectRef, authEnabled, storageEnabled, dataApiEnabled]
  )

  const services = useMemo(
    () => buildSortedServiceCards(serviceBase, serviceData),
    [serviceBase, serviceData]
  )

  // The API Gateway routes to every product, so its by-product breakdown is the
  // headline: "Total Requests" and "Success Rate" equal the API Gateway chart total.
  const apiGatewayProductData = useMemo(
    () => buildApiGatewayProductData(serviceData),
    [serviceData]
  )
  const apiGateway = useMemo(() => calculateApiGatewayAggregate(serviceData), [serviceData])
  const totalRequests = apiGateway.total
  const successRate = apiGateway.successRate

  const handleBarClick =
    (logRoute: string, serviceKey: HomeServiceKey) => (datum: LogsBarChartDatum) => {
      if (!datum?.timestamp) return

      // Logs explorer reads the range from `its`/`ite` (iso_timestamp_start/end
      // only set the label).
      const { start, end } = getBucketLogRange(datum.timestamp, interval)

      const queryParams = new URLSearchParams({
        its: start,
        ite: end,
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
            if (isChartIntervalKey(next)) setUserInterval(next)
          }}
          organizationSlug={organization?.slug}
          dropdownAlign="end"
          tooltipSide="left"
        />
      </div>
      <Row maxColumns={4} minWidth={280}>
        {services.map((s) => {
          // The API Gateway card shows the by-product breakdown, so its header
          // counts come from the aggregate to match the chart it renders.
          const isApiGateway = s.key === 'data_api'
          const total = isApiGateway ? apiGateway.total : s.total
          const warn = isApiGateway ? apiGateway.warningCount : s.warn
          const err = isApiGateway ? apiGateway.errorCount : s.err
          const disabled = isServiceDisabled(total, isLoading)
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
                    <span className="text-foreground text-xl">{total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-end gap-4 text-foreground-light">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                      <span className="heading-meta">Warnings</span>
                    </div>
                    <span className="text-foreground text-base">{warn.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                      <span className="heading-meta">Errors</span>
                    </div>
                    <span className="text-foreground text-base">{err.toLocaleString()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-card flex-1 h-full overflow-hidden">
                <Loading isFullHeight active={isLoading}>
                  {isApiGateway ? (
                    <ApiGatewayProductChart
                      data={apiGatewayProductData}
                      DateTimeFormat={datetimeFormat}
                      // The handler only reads `timestamp`, shared by both datum shapes
                      onBarClick={
                        disabled
                          ? undefined
                          : (datum) =>
                              handleBarClick(s.route, s.key)(datum as unknown as LogsBarChartDatum)
                      }
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
                  ) : (
                    <LogsBarChart
                      isFullHeight
                      data={s.data}
                      DateTimeFormat={datetimeFormat}
                      onBarClick={disabled ? undefined : handleBarClick(s.route, s.key)}
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
                  )}
                </Loading>
              </CardContent>
            </Card>
          )
        })}
      </Row>
    </div>
  )
}
