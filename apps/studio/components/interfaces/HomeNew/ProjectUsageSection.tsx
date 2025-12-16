import dayjs from 'dayjs'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { InlineLink } from 'components/ui/InlineLink'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { ChartIntervals } from 'types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Loading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { Row } from 'ui-patterns'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { useServiceStats } from './ProjectUsageSection.utils'
import type { StatsLike } from './ProjectUsageSection.utils'
import type { LogsBarChartDatum } from './ProjectUsage.metrics'
import {
  sumTotal,
  sumWarnings,
  sumErrors,
  computeSuccessAndNonSuccessRates,
  computeChangePercent,
  formatDelta,
} from './ProjectUsage.metrics'

const LOG_RETENTION = { free: 1, pro: 7, team: 28, enterprise: 90, platform: 1 }

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '1hr',
    label: 'Last 60 minutes',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
  },
  {
    key: '1day',
    label: 'Last 24 hours',
    startValue: 24,
    startUnit: 'hour',
    format: 'MMM D, ha',
    availableIn: ['free', 'pro', 'team', 'enterprise', 'platform'],
  },
  {
    key: '7day',
    label: 'Last 7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D, ha',
    availableIn: ['pro', 'team', 'enterprise'],
  },
]

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
  stats: StatsLike
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

  const statsByService = useServiceStats(projectRef!, interval)

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
        const data = currentStats.eventChartData
        const total = sumTotal(data)
        const warn = sumWarnings(data)
        const err = sumErrors(data)
        return { ...s, stats: currentStats, data, total, warn, err }
      }),
    [serviceBase, statsByService]
  )

  const isLoading = services.some((s) => s.stats.isLoading)

  const handleBarClick = (logRoute: string, serviceKey: ServiceKey) => (datum: any) => {
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
  const totalErrors = enabledServices.reduce((sum, s) => sum + (s.err || 0), 0)
  const totalWarnings = enabledServices.reduce((sum, s) => sum + (s.warn || 0), 0)
  const { successRate, nonSuccessRate } = computeSuccessAndNonSuccessRates(
    totalRequests,
    totalWarnings,
    totalErrors
  )

  const prevServiceTotals = useMemo(
    () =>
      serviceBase.map((s) => {
        const previousStats = statsByService[s.key].previous
        const data = previousStats.eventChartData
        return {
          enabled: s.enabled,
          total: sumTotal(data),
        }
      }),
    [serviceBase, statsByService]
  )

  const enabledPrev = prevServiceTotals.filter((s) => s.enabled)
  const prevTotalRequests = enabledPrev.reduce((sum, s) => sum + (s.total || 0), 0)

  const totalRequestsChangePct = computeChangePercent(totalRequests, prevTotalRequests)
  const totalDeltaClass = totalRequestsChangePct >= 0 ? 'text-brand-link' : 'text-destructive'
  const nonSuccessClass = nonSuccessRate > 0 ? 'text-destructive' : 'text-brand-link'

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-x-2">
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{totalRequests.toLocaleString()}</span>
            <span>Total Requests</span>
            <span className={cn('text-sm', totalDeltaClass)}>
              {formatDelta(totalRequestsChangePct)}
            </span>
          </div>
          <div className="flex items-start gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{successRate.toFixed(1)}%</span>
            <span>Success Rate</span>
            <span className={cn('text-sm', nonSuccessClass)}>{formatDelta(nonSuccessRate)}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="default" iconRight={<ChevronDown size={14} />}>
              <span>{selectedInterval.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-40">
            <DropdownMenuRadioGroup
              value={interval}
              onValueChange={(interval) => setInterval(interval as ChartIntervalKey)}
            >
              {CHART_INTERVALS.map((i) => {
                const disabled = !i.availableIn?.includes(plan?.id || 'free')

                if (disabled) {
                  const retentionDuration = LOG_RETENTION[plan?.id ?? 'free']
                  return (
                    <Tooltip key={i.key}>
                      <TooltipTrigger asChild>
                        <DropdownMenuRadioItem
                          disabled
                          value={i.key}
                          className="!pointer-events-auto"
                        >
                          {i.label}
                        </DropdownMenuRadioItem>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>
                          {plan?.name} plan only includes up to {retentionDuration} day
                          {retentionDuration > 1 ? 's' : ''} of log retention
                        </p>
                        <p className="text-foreground-light">
                          <InlineLink
                            className="text-foreground-light hover:text-foreground"
                            href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}
                          >
                            Upgrade your plan
                          </InlineLink>{' '}
                          to increase log retention and view statistics for the{' '}
                          {i.label.toLowerCase()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                } else {
                  return (
                    <DropdownMenuRadioItem key={i.key} value={i.key}>
                      {i.label}
                    </DropdownMenuRadioItem>
                  )
                }
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Row columns={[3, 2, 1]}>
        {enabledServices.map((s) => (
          <Card key={s.key} className="mb-0 md:mb-0 h-full flex flex-col h-64">
            <CardHeader className="flex flex-row items-end justify-between gap-2 space-y-0 pb-0 border-b-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-foreground-light">
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
                          {s.title}
                        </Link>
                      ) : (
                        s.title
                      )}
                    </CardTitle>
                  </div>
                  <span className="text-foreground text-xl">{(s.total || 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-end gap-4 text-foreground-light">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                    <span className="heading-meta">Warn</span>
                  </div>
                  <span className="text-foreground text-xl">{(s.warn || 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                    <span className="heading-meta">Err</span>
                  </div>
                  <span className="text-foreground text-xl">{(s.err || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4 flex-1 h-full overflow-hidden">
              <Loading isFullHeight active={isLoading}>
                <LogsBarChart
                  isFullHeight
                  data={s.data}
                  DateTimeFormat={datetimeFormat}
                  onBarClick={handleBarClick(s.route, s.key)}
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
