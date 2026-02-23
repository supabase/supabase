import { useFlag, useParams } from 'common'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { formatBytes } from 'lib/helpers'
import Link from 'next/link'
import { useMemo } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
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
  parseMemoryPressure,
} from './DatabaseInfrastructureSection.utils'

type DatabaseInfrastructureSectionProps = {
  interval: '1hr' | '1day' | '7day'
  refreshKey: number
  dbErrorRate: number
  isLoading: boolean
  slowQueriesCount?: number
  slowQueriesLoading?: boolean
  hideTitle?: boolean
  startDate?: string
  endDate?: string
  showLinks?: boolean
}

export const DatabaseInfrastructureSection = ({
  interval,
  refreshKey,
  dbErrorRate,
  isLoading: dbLoading,
  slowQueriesCount = 0,
  slowQueriesLoading = false,
  hideTitle = false,
  startDate: propStartDate,
  endDate: propEndDate,
  showLinks = true,
}: DatabaseInfrastructureSectionProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const databaseReportMetrics = useFlag('DatabaseReportMetrics')

  // refreshKey forces date recalculation when user clicks refresh button
  // Use provided dates if available, otherwise calculate from interval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { startDate, endDate, infraInterval } = useMemo(() => {
    let start: string
    let end: string
    let infraInterval: '1h' | '1d'

    // If custom dates are provided, use them
    if (propStartDate && propEndDate) {
      start = propStartDate
      end = propEndDate
      // Determine infraInterval based on the date range
      const hoursDiff = dayjs(end).diff(dayjs(start), 'hour')
      infraInterval = hoursDiff > 48 ? '1d' : '1h'
    } else {
      // Otherwise, calculate from interval (original behavior)
      const now = dayjs()
      end = now.toISOString()

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
    }

    return { startDate: start, endDate: end, infraInterval }
  }, [interval, refreshKey, propStartDate, propEndDate])

  const {
    data: infraData,
    isLoading: infraLoading,
    error: infraError,
  } = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: [
      'avg_cpu_usage',
      'ram_usage',
      'ram_usage_used',
      'ram_usage_cache_and_buffers',
      'ram_usage_free',
      'swap_usage',
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

  // Get cache hit rate from query performance
  const { data: queryMetrics } = useQueryPerformanceQuery({
    preset: 'queryMetrics',
  })

  const metrics = useMemo(() => parseInfrastructureMetrics(infraData), [infraData])
  const memoryPressure = useMemo(() => parseMemoryPressure(infraData), [infraData])

  const connections = useMemo(
    () => parseConnectionsData(infraData, maxConnectionsData),
    [infraData, maxConnectionsData]
  )

  const diskDetails = useMemo(() => {
    if (!infraData) return null
    const series = 'series' in infraData ? infraData.series : {}

    const parseValue = (val: string | number | undefined): number => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') return parseFloat(val) || 0
      return 0
    }

    const diskSystemValue = parseValue(series.disk_fs_used_system?.totalAverage)
    const diskWalValue = parseValue(series.disk_fs_used_wal?.totalAverage)
    const diskDatabaseValue = parseValue(series.pg_database_size?.totalAverage)
    const diskSizeValue = parseValue(series.disk_fs_size?.totalAverage)
    const diskUsedValue = diskSystemValue + diskWalValue + diskDatabaseValue

    return {
      used: diskUsedValue,
      total: diskSizeValue,
    }
  }, [infraData])

  const cacheHitRate = queryMetrics?.[0]?.cache_hit_rate || '0%'

  const errorMessage =
    infraError && typeof infraError === 'object' && 'message' in infraError
      ? String(infraError.message)
      : 'Error loading data'

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

  if (!databaseReportMetrics) {
    return null
  }

  return (
    <div>
      {!hideTitle && <h2 className="mb-4">Database</h2>}
      {/* First row: Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href={`/project/${projectRef}/observability/query-performance?totalTimeFilter=${encodeURIComponent(JSON.stringify({ operator: '>', value: 1000 }))}`}
          className="block group h-full"
        >
          <MetricCard isLoading={slowQueriesLoading} className="h-full">
            <MetricCardHeader
              href={`/project/${projectRef}/observability/query-performance?totalTimeFilter=${encodeURIComponent(JSON.stringify({ operator: '>', value: 1000 }))}`}
              linkTooltip="Go to query performance"
            >
              <MetricCardLabel tooltip="Queries with total execution time (execution time + planning time) greater than 1000ms. High values may indicate query optimization opportunities">
                Slow Queries
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue>{slowQueriesCount}</MetricCardValue>
            </MetricCardContent>
          </MetricCard>
        </Link>

        {showLinks ? (
          <Link href={databaseReportUrl} className="block group h-full">
            <MetricCard isLoading={infraLoading} className="h-full">
              <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
                <MetricCardLabel
                  tooltip={
                    <div className="space-y-2">
                      <p>
                        Active database connections (current/max). Monitor to avoid connection
                        exhaustion.
                      </p>
                      <Link
                        href="https://supabase.com/docs/guides/troubleshooting?search=connections"
                        target="_blank"
                        className="text-xs text-brand font-medium hover:underline"
                      >
                        Troubleshooting guide
                      </Link>
                    </div>
                  }
                >
                  Connections
                </MetricCardLabel>
              </MetricCardHeader>
              <MetricCardContent>
                {infraError ? (
                  <div className="text-xs text-destructive break-words">{errorMessage}</div>
                ) : connections.max > 0 ? (
                  <MetricCardValue>
                    {connections.current}/{connections.max}
                  </MetricCardValue>
                ) : (
                  <MetricCardValue>--</MetricCardValue>
                )}
              </MetricCardContent>
            </MetricCard>
          </Link>
        ) : (
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader>
              <MetricCardLabel
                tooltip={
                  <div className="space-y-2">
                    <p>
                      Active database connections (current/max). Monitor to avoid connection
                      exhaustion.
                    </p>
                    <Link
                      href="https://supabase.com/docs/guides/troubleshooting?search=connections"
                      target="_blank"
                      className="text-xs text-brand font-medium hover:underline"
                    >
                      Troubleshooting guide
                    </Link>
                  </div>
                }
              >
                Connections
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : connections.max > 0 ? (
                <MetricCardValue>
                  {connections.current}/{connections.max}
                </MetricCardValue>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        )}

        {showLinks ? (
          <Link href={databaseReportUrl} className="block group h-full">
            <MetricCard isLoading={infraLoading} className="h-full">
              <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
                <MetricCardLabel tooltip="Disk usage percentage of total disk space used">
                  Disk Usage
                </MetricCardLabel>
              </MetricCardHeader>
              <MetricCardContent>
                {infraError ? (
                  <div className="text-xs text-destructive break-words">{errorMessage}</div>
                ) : metrics && diskDetails ? (
                  <div className="flex flex-col gap-1">
                    <MetricCardValue>{metrics.disk.current.toFixed(0)}%</MetricCardValue>
                    <div className="text-xs">
                      <span className="text-foreground-lighter">Used:</span>{' '}
                      <span className="font-mono text-foreground">
                        {formatBytes(diskDetails.used)}
                      </span>{' '}
                      <span className="text-foreground-lighter">·</span>{' '}
                      <span className="text-foreground-lighter">Total:</span>{' '}
                      <span className="font-mono text-foreground">
                        {formatBytes(diskDetails.total)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <MetricCardValue>--</MetricCardValue>
                )}
              </MetricCardContent>
            </MetricCard>
          </Link>
        ) : (
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader>
              <MetricCardLabel tooltip="Disk usage percentage of total disk space used">
                Disk Usage
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics && diskDetails ? (
                <div className="flex flex-col gap-1">
                  <MetricCardValue>{metrics.disk.current.toFixed(0)}%</MetricCardValue>
                  <div className="text-xs">
                    <span className="text-foreground-lighter">Used:</span>{' '}
                    <span className="font-mono text-foreground">
                      {formatBytes(diskDetails.used)}
                    </span>{' '}
                    <span className="text-foreground-lighter">·</span>{' '}
                    <span className="text-foreground-lighter">Total:</span>{' '}
                    <span className="font-mono text-foreground">
                      {formatBytes(diskDetails.total)}
                    </span>
                  </div>
                </div>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        )}

        {showLinks ? (
          <Link href={databaseReportUrl} className="block group h-full">
            <MetricCard isLoading={infraLoading} className="h-full">
              <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
                <MetricCardLabel
                  tooltip={
                    <div className="space-y-2">
                      <p>
                        Disk I/O consumption percentage. High values may indicate disk bottlenecks.
                      </p>
                      <Link
                        href="https://supabase.com/docs/guides/troubleshooting/exhaust-disk-io"
                        target="_blank"
                        className="text-xs text-brand font-medium hover:underline"
                      >
                        Troubleshooting guide
                      </Link>
                    </div>
                  }
                >
                  Disk IO
                </MetricCardLabel>
              </MetricCardHeader>
              <MetricCardContent>
                {infraError ? (
                  <div className="text-xs text-destructive break-words">{errorMessage}</div>
                ) : metrics ? (
                  <MetricCardValue>{metrics.diskIo.current.toFixed(0)}%</MetricCardValue>
                ) : (
                  <MetricCardValue>--</MetricCardValue>
                )}
              </MetricCardContent>
            </MetricCard>
          </Link>
        ) : (
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader>
              <MetricCardLabel
                tooltip={
                  <div className="space-y-2">
                    <p>
                      Disk I/O consumption percentage. High values may indicate disk bottlenecks.
                    </p>
                    <Link
                      href="https://supabase.com/docs/guides/troubleshooting/exhaust-disk-io"
                      target="_blank"
                      className="text-xs text-brand font-medium hover:underline"
                    >
                      Troubleshooting guide
                    </Link>
                  </div>
                }
              >
                Disk IO
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <MetricCardValue>{metrics.diskIo.current.toFixed(0)}%</MetricCardValue>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        )}

        {showLinks ? (
          <Link href={databaseReportUrl} className="block group h-full">
            <MetricCard isLoading={infraLoading} className="h-full">
              <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
                <MetricCardLabel
                  tooltip={
                    <div>
                      <p>Overall memory health based on swap and non-cache memory.</p>
                      <ul>
                        <li>Healthy: swap &lt; max(64 MB, 1% of RAM)</li>
                        <li>Elevated: swap ≥ max(64 MB, 1% of RAM)</li>
                        <li>Unhealthy: swap ≥ max(256 MB, 3% of RAM)</li>
                      </ul>
                    </div>
                  }
                >
                  Memory Pressure
                </MetricCardLabel>
              </MetricCardHeader>
              <MetricCardContent>
                {infraError ? (
                  <div className="text-xs text-destructive break-words">{errorMessage}</div>
                ) : memoryPressure ? (
                  <div className="flex flex-col gap-1">
                    <MetricCardValue
                      className={cn({
                        'text-foreground': memoryPressure.level === 'Healthy',
                        'text-warning': memoryPressure.level === 'Elevated',
                        'text-destructive': memoryPressure.level === 'Unhealthy',
                      })}
                    >
                      {memoryPressure.level}
                    </MetricCardValue>
                    <div className="text-xs">
                      <span className="text-foreground-lighter">Swap:</span>{' '}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-foreground border-b border-dashed border-foreground-lighter cursor-help">
                            {memoryPressure.swapUsedMB > 0 && memoryPressure.swapUsedMB < 1
                              ? '<1'
                              : memoryPressure.swapUsedMB.toFixed(0)}{' '}
                            MB
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="flex flex-col gap-2">
                            <p className="text-xs">
                              Swap is disk used as emergency memory. High swap can slow queries and
                              indicates memory pressure.
                            </p>
                            <p className="text-xs">
                              Swap usage: {memoryPressure.swapPercent.toFixed(1)}% of RAM
                            </p>
                            <Link
                              href="https://supabase.com/docs/guides/troubleshooting/exhaust-swap"
                              target="_blank"
                              className="text-xs text-brand font-medium hover:underline"
                            >
                              Troubleshooting guide
                            </Link>
                          </div>
                        </TooltipContent>
                      </Tooltip>{' '}
                      <span className="text-foreground-lighter">·</span>{' '}
                      <span className="text-foreground-lighter">Cache hit:</span>{' '}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-foreground border-b border-dashed border-foreground-lighter cursor-help">
                            {cacheHitRate}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Percentage of queries served from memory cache vs disk. Higher is better.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <MetricCardValue>--</MetricCardValue>
                )}
              </MetricCardContent>
            </MetricCard>
          </Link>
        ) : (
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader>
              <MetricCardLabel
                tooltip={
                  <div className="space-y-2">
                    <p>Overall memory health based on swap and non-cache memory.</p>
                    <ul>
                      <li>
                        Healthy: <code>swap &lt; max(64 MB, 1% of RAM)</code>
                      </li>
                      <li>
                        Elevated: <code>swap ≥ max(64 MB, 1% of RAM)</code>
                      </li>
                      <li>
                        Unhealthy: <code>swap ≥ max(256 MB, 3% of RAM)</code>
                      </li>
                    </ul>
                    <p className="text-foreground-light">Troubleshooting guides</p>
                    <p className="grid">
                      <Link
                        href="https://supabase.com/docs/guides/troubleshooting/memory-and-swap-usage-explained-aPNgm0"
                        target="_blank"
                        className="text-xs text-brand font-medium hover:underline"
                      >
                        Memory and Swap usage explained
                      </Link>
                      <Link
                        href="https://supabase.com/docs/guides/troubleshooting/exhaust-swap"
                        target="_blank"
                        className="text-xs text-brand font-medium hover:underline"
                      >
                        High swap usage
                      </Link>
                    </p>
                  </div>
                }
              >
                Memory Pressure
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : memoryPressure ? (
                <div className="flex flex-col gap-1">
                  <MetricCardValue
                    className={cn({
                      'text-foreground': memoryPressure.level === 'Healthy',
                      'text-warning': memoryPressure.level === 'Elevated',
                      'text-destructive': memoryPressure.level === 'Unhealthy',
                    })}
                  >
                    {memoryPressure.level}
                  </MetricCardValue>
                  <div className="text-xs">
                    <span className="text-foreground-lighter">Swap:</span>{' '}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-foreground border-b border-dashed border-foreground-lighter cursor-help">
                          {memoryPressure.swapUsedMB > 0 && memoryPressure.swapUsedMB < 1
                            ? '<1'
                            : memoryPressure.swapUsedMB.toFixed(0)}{' '}
                          MB
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs">
                            Swap is disk used as emergency memory. High swap can slow queries and
                            indicates memory pressure.
                          </p>
                          <p className="text-xs">
                            Swap usage: {memoryPressure.swapPercent.toFixed(1)}% of RAM
                          </p>
                          <Link
                            href="https://supabase.com/docs/guides/troubleshooting/exhaust-swap"
                            target="_blank"
                            className="text-xs text-brand font-medium hover:underline"
                          >
                            Troubleshooting guide
                          </Link>
                        </div>
                      </TooltipContent>
                    </Tooltip>{' '}
                    <span className="text-foreground-lighter">·</span>{' '}
                    <span className="text-foreground-lighter">Cache hit:</span>{' '}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-foreground border-b border-dashed border-foreground-lighter cursor-help">
                          {cacheHitRate}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Percentage of queries served from memory cache vs disk. Higher is better.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        )}

        {showLinks ? (
          <Link href={databaseReportUrl} className="block group h-full">
            <MetricCard isLoading={infraLoading} className="h-full">
              <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
                <MetricCardLabel
                  tooltip={
                    <div className="space-y-2">
                      <p>
                        Average CPU usage percentage over the selected time period. High values may suggest CPU-intensive queries or
                        workloads.
                      </p>
                      <Link
                        href="https://supabase.com/docs/guides/troubleshooting?search=cpu"
                        target="_blank"
                        className="text-xs text-brand font-medium hover:underline"
                      >
                        Troubleshooting guide
                      </Link>
                    </div>
                  }
                >
                  Avg CPU
                </MetricCardLabel>
              </MetricCardHeader>
              <MetricCardContent>
                {infraError ? (
                  <div className="text-xs text-destructive break-words">{errorMessage}</div>
                ) : metrics ? (
                  <MetricCardValue>{metrics.cpu.current.toFixed(0)}%</MetricCardValue>
                ) : (
                  <MetricCardValue>--</MetricCardValue>
                )}
              </MetricCardContent>
            </MetricCard>
          </Link>
        ) : (
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader>
              <MetricCardLabel
                tooltip={
                  <div className="space-y-2">
                    <p>
                      Average CPU usage percentage over the selected time period. High values may suggest CPU-intensive queries or
                      workloads.
                    </p>
                    <Link
                      href="https://supabase.com/docs/guides/troubleshooting?search=cpu"
                      target="_blank"
                      className="text-xs text-brand font-medium hover:underline"
                    >
                      Troubleshooting guide
                    </Link>
                  </div>
                }
              >
                Avg CPU
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <MetricCardValue>{metrics.cpu.current.toFixed(0)}%</MetricCardValue>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        )}
      </div>
    </div>
  )
}
