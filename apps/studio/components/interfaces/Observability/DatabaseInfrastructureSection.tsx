import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'
import {
  MetricCard,
  MetricCardContent,
  MetricCardHeader,
  MetricCardLabel,
  MetricCardValue,
} from 'ui-patterns/MetricCard'

import {
  parseConnectionsData,
  parseInfrastructureMetrics,
} from './DatabaseInfrastructureSection.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// A single metric tile: a linked card with a labelled header and a value slot
const MetricLinkCard = ({
  href,
  linkTooltip,
  label,
  labelTooltip,
  isLoading,
  children,
}: {
  href: string
  linkTooltip: string
  label: string
  labelTooltip: string
  isLoading?: boolean
  children: ReactNode
}) => (
  <Link href={href} className="block group">
    <MetricCard isLoading={isLoading}>
      <MetricCardHeader href={href} linkTooltip={linkTooltip}>
        <MetricCardLabel tooltip={labelTooltip}>{label}</MetricCardLabel>
      </MetricCardHeader>
      <MetricCardContent>{children}</MetricCardContent>
    </MetricCard>
  </Link>
)

type DatabaseInfrastructureSectionProps = {
  interval: '1hr' | '1day' | '7day'
  refreshKey: number
  dbErrorRate: number
  isLoading: boolean
  slowQueriesCount?: number
  slowQueriesLoading?: boolean
}

export const DatabaseInfrastructureSection = ({
  interval,
  refreshKey,
  dbErrorRate: _dbErrorRate,
  isLoading: _dbLoading,
  slowQueriesCount = 0,
  slowQueriesLoading = false,
}: DatabaseInfrastructureSectionProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // refreshKey forces date recalculation when user clicks refresh button
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { startDate, endDate, infraInterval } = useMemo(() => {
    const now = dayjs()
    const end = now.toISOString()
    let start: string
    let infraInterval: '1h' | '1d'

    switch (interval) {
      case '1hr':
        start = now.subtract(1, 'hour').toISOString()
        infraInterval = '1h'
        break
      case '1day':
        start = now.subtract(1, 'day').toISOString()
        infraInterval = '1h'
        break
      case '7day':
        start = now.subtract(7, 'day').toISOString()
        infraInterval = '1d'
        break
      default:
        start = now.subtract(1, 'hour').toISOString()
        infraInterval = '1h'
    }

    return { startDate: start, endDate: end, infraInterval }
  }, [interval, refreshKey])

  const {
    data: infraData,
    isLoading: infraLoading,
    error: infraError,
  } = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: [
      'avg_cpu_usage',
      'ram_usage',
      'disk_fs_used_system',
      'disk_fs_used_wal',
      'pg_database_size',
      'disk_fs_size',
      'disk_io_consumption',
      'pg_stat_database_num_backends',
    ],
    startDate,
    endDate,
    interval: infraInterval,
  })

  const { data: maxConnectionsData } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  const metrics = useMemo(() => parseInfrastructureMetrics(infraData), [infraData])

  const connections = useMemo(
    () => parseConnectionsData(infraData, maxConnectionsData),
    [infraData, maxConnectionsData]
  )

  // Generate database report URL with time range parameters
  const getDatabaseReportUrl = () => {
    const now = dayjs()
    let its: string
    let helperText: string

    switch (interval) {
      case '1hr':
        its = now.subtract(1, 'hour').toISOString()
        helperText = 'Last 60 minutes'
        break
      case '1day':
        its = now.subtract(24, 'hour').toISOString()
        helperText = 'Last 24 hours'
        break
      case '7day':
        its = now.subtract(7, 'day').toISOString()
        helperText = 'Last 7 days'
        break
      default:
        its = now.subtract(24, 'hour').toISOString()
        helperText = 'Last 24 hours'
    }

    const ite = now.toISOString()
    const params = new URLSearchParams({
      its,
      ite,
      isHelper: 'true',
      helperText,
    })

    return `/project/${projectRef}/observability/database?${params.toString()}`
  }

  const databaseReportUrl = getDatabaseReportUrl()

  const slowQueriesUrl = `/project/${projectRef}/observability/query-performance?totalTimeFilter=${encodeURIComponent(
    JSON.stringify({ operator: '>', value: 1000 })
  )}`

  const infraMetrics = [
    {
      label: 'Disk Usage',
      tooltip: 'Disk usage percentage of total disk space used',
      value: metrics?.disk.current,
    },
    {
      label: 'Disk IO',
      tooltip: 'Disk I/O consumption percentage. High values may indicate disk bottlenecks',
      value: metrics?.diskIo.current,
    },
    {
      label: 'Memory',
      tooltip: 'RAM usage percentage. Sustained high usage may indicate memory pressure',
      value: metrics?.ram.current,
    },
    {
      label: 'CPU',
      tooltip: 'CPU usage percentage. High values may suggest CPU-intensive queries or workloads',
      value: metrics?.cpu.current,
    },
  ]

  return (
    <div>
      <h2 className="mb-4">Database</h2>
      {/* First row: Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricLinkCard
          href={slowQueriesUrl}
          linkTooltip="Go to query performance"
          label="Slow Queries"
          labelTooltip="Queries with total execution time (execution time + planning time) greater than 1000ms. High values may indicate query optimization opportunities"
          isLoading={slowQueriesLoading}
        >
          <MetricCardValue>{slowQueriesCount}</MetricCardValue>
        </MetricLinkCard>

        {infraError ? (
          <div className="col-span-2 flex items-center rounded-md border border-dashed px-4 py-3">
            <p className="text-sm text-foreground-light">
              Unable to load. Please try again in a few minutes. If the problem persists please
              check our <InlineLink href="https://status.supabase.com">status page</InlineLink>.
            </p>
          </div>
        ) : (
          <>
            <MetricLinkCard
              href={databaseReportUrl}
              linkTooltip="Go to database report"
              label="Peak Connections"
              labelTooltip="Highest concurrent database connections observed in the selected window, against the connection limit. Monitor to avoid connection exhaustion."
              isLoading={infraLoading}
            >
              <MetricCardValue>
                {connections.max > 0 ? `${connections.peak}/${connections.max}` : '--'}
              </MetricCardValue>
            </MetricLinkCard>

            {infraMetrics.map((metric) => (
              <MetricLinkCard
                key={metric.label}
                href={databaseReportUrl}
                linkTooltip="Go to database report"
                label={metric.label}
                labelTooltip={metric.tooltip}
                isLoading={infraLoading}
              >
                <MetricCardValue>
                  {metric.value !== undefined ? `${metric.value.toFixed(0)}%` : '--'}
                </MetricCardValue>
              </MetricLinkCard>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
