import dayjs from 'dayjs'
import sumBy from 'lodash/sumBy'
import { Archive, ChevronDown, Database, Key, Zap, Code } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import StackedBarChart from 'components/ui/Charts/StackedBarChart'
import { InlineLink } from 'components/ui/InlineLink'
import {
  ProjectLogStatsVariables,
  useProjectLogStatsQuery,
} from 'data/analytics/project-log-stats-query'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { ChartIntervals } from 'types'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Loading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Row } from 'ui-patterns'

type ChartIntervalKey = ProjectLogStatsVariables['interval']

const LOG_RETENTION = { free: 1, pro: 7, team: 28, enterprise: 90 }

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '1hr',
    label: 'Last 60 minutes',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
  },
  {
    key: '1day',
    label: 'Last 24 hours',
    startValue: 24,
    startUnit: 'hour',
    format: 'MMM D, ha',
    availableIn: ['free', 'pro', 'team', 'enterprise'],
  },
  {
    key: '7day',
    label: 'Last 7 days',
    startValue: 7,
    startUnit: 'day',
    format: 'MMM D',
    availableIn: ['pro', 'team', 'enterprise'],
  },
]

type UsageStatus = 'Ok' | 'Warn' | 'Err'

type StatusTimeseriesDatum = {
  timestamp: string
  count: number
  status: UsageStatus
}

const seededRatio = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const n = Math.abs(hash % 1000)
  return n / 1000
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const generateStatusTimeSeries = (
  base: any[] = [],
  totalKey: string,
  serviceKey: string
): StatusTimeseriesDatum[] => {
  const rows: StatusTimeseriesDatum[] = []
  for (const point of base) {
    const ts = String(point.timestamp)
    const total = Number(point?.[totalKey] || 0)

    const seededBaseline = Math.round(5 + seededRatio(`${serviceKey}-${ts}-base`) * 20)
    const jitter = 0.85 + seededRatio(`${serviceKey}-${ts}-jitter`) * 0.4
    let effectiveTotal = total > 0 ? Math.max(1, Math.round(total * jitter)) : seededBaseline
    const spikeChance = seededRatio(`${serviceKey}-${ts}-spike`)
    
    if (spikeChance > 0.98) {
      effectiveTotal = Math.round(effectiveTotal * 2.5)
    } else if (spikeChance < 0.02) {
      effectiveTotal = Math.max(1, Math.round(effectiveTotal * 0.6))
    }

    const r1 = seededRatio(`${serviceKey}-${ts}-a`)
    const r2 = seededRatio(`${serviceKey}-${ts}-b`)
    const ratioJitter = 0.8 + seededRatio(`${serviceKey}-${ts}-rj`) * 0.4
    const warnRatio = clamp((0.05 + r1 * 0.15) * ratioJitter, 0, 0.9)
    const errRatio = clamp((0.01 + r2 * 0.09) * ratioJitter, 0, 0.5)
    
    let warn = Math.round(effectiveTotal * warnRatio)
    let err = Math.round(effectiveTotal * errRatio)
    let ok = effectiveTotal - warn - err
    
    if (ok < 0) {
      const deficit = -ok
      const takeFromWarn = Math.min(deficit, warn)
      warn -= takeFromWarn
      const remaining = deficit - takeFromWarn
      const takeFromErr = Math.min(remaining, err)
      err -= takeFromErr
      ok = effectiveTotal - warn - err
    }

    rows.push(
      { timestamp: ts, count: ok, status: 'Ok' },
      { timestamp: ts, count: warn, status: 'Warn' },
      { timestamp: ts, count: err, status: 'Err' }
    )
  }
  return rows
}

const sumStatus = (rows: StatusTimeseriesDatum[], status: UsageStatus) =>
  rows.filter((r) => r.status === status).reduce((acc, r) => acc + (Number(r.count) || 0), 0)

const ProjectUsage = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()
  const { projectAuthAll: authEnabled, projectStorageAll: storageEnabled } = useIsFeatureEnabled([
    'project_auth:all',
    'project_storage:all',
  ])
  const { plan } = useCurrentOrgPlan()

  const DEFAULT_INTERVAL: ChartIntervalKey = plan?.id === 'free' ? '1hr' : '1day'
  const [interval, setInterval] = useState<ChartIntervalKey>(DEFAULT_INTERVAL)
  const { data, isLoading } = useProjectLogStatsQuery({ projectRef, interval })

  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const startDateLocal = dayjs().subtract(
    selectedInterval.startValue,
    selectedInterval.startUnit as dayjs.ManipulateType
  )
  const endDateLocal = dayjs()
  const fillInterval = interval === '1hr' ? '5m' : interval === '1day' ? '30m' : '2h'

  const { data: charts } = useFillTimeseriesSorted(
    data?.result || [],
    'timestamp',
    ['total_auth_requests', 'total_rest_requests', 'total_storage_requests', 'total_realtime_requests'],
    10,
    startDateLocal.toISOString(),
    endDateLocal.toISOString(),
    Number.MAX_SAFE_INTEGER,
    fillInterval
  )
  const datetimeFormat = selectedInterval.format || 'MMM D, ha'

  // Build per-service status series and totals (mocked breakdown based on aggregated totals)
  const restSeries = generateStatusTimeSeries(charts, 'total_rest_requests', 'rest')
  const restTotal = sumBy(charts || [], 'total_rest_requests')
  const restWarn = sumStatus(restSeries, 'Warn')
  const restErr = sumStatus(restSeries, 'Err')

  const authSeries = generateStatusTimeSeries(charts, 'total_auth_requests', 'auth')
  const authTotal = sumBy(charts || [], 'total_auth_requests')
  const authWarn = sumStatus(authSeries, 'Warn')
  const authErr = sumStatus(authSeries, 'Err')

  const storageSeries = generateStatusTimeSeries(charts, 'total_storage_requests', 'storage')
  const storageTotal = sumBy(charts || [], 'total_storage_requests')
  const storageWarn = sumStatus(storageSeries, 'Warn')
  const storageErr = sumStatus(storageSeries, 'Err')

  const realtimeSeries = generateStatusTimeSeries(charts, 'total_realtime_requests', 'realtime')
  const realtimeTotal = sumBy(charts || [], 'total_realtime_requests')
  const realtimeWarn = sumStatus(realtimeSeries, 'Warn')
  const realtimeErr = sumStatus(realtimeSeries, 'Err')

  const edgeCharts = (charts || []).map((c) => {
    const base = Number(c.total_rest_requests || 0) * 0.12 + Number(c.total_auth_requests || 0) * 0.08 || 0
    const ts = String(c.timestamp)
    const jitter = 0.8 + seededRatio(`edge-${ts}-j`) * 0.6
    const spike = seededRatio(`edge-${ts}-s`)
    let total = Math.max(1, Math.round(base * jitter))
    if (spike > 0.985) total = Math.round(total * 2.2)
    if (spike < 0.015) total = Math.max(1, Math.round(total * 0.5))
    return { ...c, total_edge_requests: total }
  })
  const edgeSeries = generateStatusTimeSeries(edgeCharts, 'total_edge_requests', 'edge')
  const edgeTotal = sumBy(edgeCharts || [], 'total_edge_requests')
  const edgeWarn = sumStatus(edgeSeries, 'Warn')
  const edgeErr = sumStatus(edgeSeries, 'Err')

  const totalRequests = (restTotal || 0) + (edgeTotal || 0) + (realtimeTotal || 0) +
    (authEnabled ? authTotal || 0 : 0) + (storageEnabled ? storageTotal || 0 : 0)
  const totalErrors = (restErr || 0) + (edgeErr || 0) + (realtimeErr || 0) +
    (authEnabled ? authErr || 0 : 0) + (storageEnabled ? storageErr || 0 : 0)
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  const trDeltaSeed = seededRatio(`tr-${projectRef}-${interval}`)
  const erDeltaSeed = seededRatio(`er-${projectRef}-${interval}`)
  const totalRequestsChangePct = (trDeltaSeed - 0.5) * 100
  const errorRateChangePct = (erDeltaSeed - 0.5) * 60
  const formatDelta = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`
  const totalDeltaClass = totalRequestsChangePct >= 0 ? 'text-brand' : 'text-destructive'
  const errorDeltaClass = errorRateChangePct <= 0 ? 'text-brand' : 'text-destructive'

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-between items-center gap-x-2">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{totalRequests.toLocaleString()}</span>
            <span>Total Requests</span>
            <span className={`${totalDeltaClass}`}>{formatDelta(totalRequestsChangePct)}</span>
          </div>
          <span className="text-foreground-muted">/</span>
          <div className="flex items-baseline gap-2 heading-section text-foreground-light">
            <span className="text-foreground">{errorRate.toFixed(1)}%</span>
            <span>Error Rate</span>
            <span className={`${errorDeltaClass}`}>{formatDelta(errorRateChangePct)}</span>
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
              onValueChange={(interval) =>
                setInterval(interval as ProjectLogStatsVariables['interval'])
              }
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
        <Card className="mb-0 md:mb-0">
          <PanelHeader
            icon={<Database strokeWidth={1.5} size={16} className="text-foreground-lighter" />}
            title="Database requests"
            href={`/project/${projectRef}/editor`}
            total={restTotal}
            warn={restWarn}
            err={restErr}
          />
          <CardContent className="p-6 pt-4">
            <Loading active={isLoading}>
              <StackedBarChart
                data={restSeries}
                xAxisKey="timestamp"
                yAxisKey="count"
                stackKey="status"
                customDateFormat={datetimeFormat}
                hideHeader
                hideLegend
                syncId="usage-rest"
                stackColors={['red', 'green', 'yellow']}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              />
            </Loading>
          </CardContent>
        </Card>
        <Card className="mb-0 md:mb-0">
          <PanelHeader
            icon={<Code strokeWidth={1.5} size={16} className="text-foreground-lighter" />}
            title="Functions requests"
            total={edgeTotal}
            warn={edgeWarn}
            err={edgeErr}
          />
          <CardContent className="p-6 pt-4">
            <Loading active={isLoading}>
              <StackedBarChart
                data={edgeSeries}
                xAxisKey="timestamp"
                yAxisKey="count"
                stackKey="status"
                customDateFormat={datetimeFormat}
                hideHeader
                hideLegend
                syncId="usage-edge"
                stackColors={['red', 'green', 'yellow']}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              />
            </Loading>
          </CardContent>
        </Card>
        {authEnabled && (
          <Card className="mb-0 md:mb-0">
            <PanelHeader
              icon={<Key strokeWidth={1.5} size={16} className="text-foreground-lighter" />}
              title="Auth requests"
              href={`/project/${projectRef}/auth/users`}
              total={authTotal}
              warn={authWarn}
              err={authErr}
            />
            <CardContent className="p-6 pt-4">
              <Loading active={isLoading}>
                <StackedBarChart
                  data={authSeries}
                  xAxisKey="timestamp"
                  yAxisKey="count"
                  stackKey="status"
                  customDateFormat={datetimeFormat}
                  hideHeader
                  hideLegend
                  syncId="usage-auth"
                  stackColors={['red', 'green', 'yellow']}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                />
              </Loading>
            </CardContent>
          </Card>
        )}
        {storageEnabled && (
          <Card className="mb-0 md:mb-0">
            <PanelHeader
              icon={<Archive strokeWidth={1.5} size={16} className="text-foreground-lighter" />}
              title="Storage requests"
              href={`/project/${projectRef}/storage/buckets`}
              total={storageTotal}
              warn={storageWarn}
              err={storageErr}
            />
            <CardContent className="p-6 pt-4">
              <Loading active={isLoading}>
                <StackedBarChart
                  data={storageSeries}
                  xAxisKey="timestamp"
                  yAxisKey="count"
                  stackKey="status"
                  customDateFormat={datetimeFormat}
                  hideHeader
                  hideLegend
                  syncId="usage-storage"
                  stackColors={['red', 'green', 'yellow']}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                />
              </Loading>
            </CardContent>
          </Card>
        )}
        <Card className="mb-0 md:mb-0">
          <PanelHeader
            icon={<Zap strokeWidth={1.5} size={16} className="text-foreground-lighter" />}
            title="Realtime requests"
            total={realtimeTotal}
            warn={realtimeWarn}
            err={realtimeErr}
          />
          <CardContent className="p-6 pt-4">
            <Loading active={isLoading}>
              <StackedBarChart
                data={realtimeSeries}
                xAxisKey="timestamp"
                yAxisKey="count"
                stackKey="status"
                customDateFormat={datetimeFormat}
                hideHeader
                hideLegend
                syncId="usage-realtime"
                stackColors={['red', 'green', 'yellow']}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              />
            </Loading>
          </CardContent>
        </Card>
      </Row>
    </div>
  )
}
export default ProjectUsage

const PanelHeader = ({
  icon,
  title,
  href,
  total,
  warn,
  err,
}: {
  icon?: React.ReactNode
  title: string
  href?: string
  total?: number
  warn?: number
  err?: number
}) => (
  <CardHeader className="flex flex-row items-end justify-between gap-2 space-y-0 pb-0 border-b-0">
    <div className="flex items-center gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <CardTitle className="text-foreground-light">
            {href ? <Link href={href}>{title}</Link> : title}
          </CardTitle>
        </div>
        <span className="text-foreground text-xl">{(total || 0).toLocaleString()}</span>
      </div>
    </div>
    <div className="flex items-end gap-4 text-foreground-light">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-warning rounded-full" />
          <span className="heading-meta">Warn</span>
        </div>
        <span className="text-foreground text-xl">{(warn || 0).toLocaleString()}</span>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
          <span className="heading-meta">Err</span>
        </div>
        <span className="text-foreground text-xl">{(err || 0).toLocaleString()}</span>
      </div>
    </div>
  </CardHeader>
)
