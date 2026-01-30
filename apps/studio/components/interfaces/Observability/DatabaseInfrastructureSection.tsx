import { useParams } from 'common'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import Link from 'next/link'
import { useMemo } from 'react'
import { cn } from 'ui'
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
  dbErrorRate,
  isLoading: dbLoading,
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

  return (
    <div>
      <h2 className="mb-4">Database</h2>
      {/* First row: Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <Link href={databaseReportUrl} className="block group">
          <MetricCard isLoading={dbLoading}>
            <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
              <MetricCardLabel tooltip="Percentage of database operations resulting in errors or warnings">
                Error Rate
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue>{dbErrorRate.toFixed(2)}%</MetricCardValue>
            </MetricCardContent>
          </MetricCard>
        </Link>

        <Link
          href={`/project/${projectRef}/observability/query-performance?totalTimeFilter=${encodeURIComponent(JSON.stringify({ operator: '>', value: 1000 }))}`}
          className="block group"
        >
          <MetricCard isLoading={slowQueriesLoading}>
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

        <Link href={databaseReportUrl} className="block group">
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
              <MetricCardLabel tooltip="Active database connections (current/max). Monitor to avoid connection exhaustion">
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

        <Link href={databaseReportUrl} className="block group">
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
              <MetricCardLabel tooltip="Disk I/O consumption percentage. High values may indicate disk bottlenecks">
                Disk
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <MetricCardValue>{metrics.disk.current.toFixed(0)}%</MetricCardValue>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        </Link>

        <Link href={databaseReportUrl} className="block group">
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
              <MetricCardLabel tooltip="RAM usage percentage. Sustained high usage may indicate memory pressure">
                Memory
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              {infraError ? (
                <div className="text-xs text-destructive break-words">{errorMessage}</div>
              ) : metrics ? (
                <MetricCardValue>{metrics.ram.current.toFixed(0)}%</MetricCardValue>
              ) : (
                <MetricCardValue>--</MetricCardValue>
              )}
            </MetricCardContent>
          </MetricCard>
        </Link>

        <Link href={databaseReportUrl} className="block group">
          <MetricCard isLoading={infraLoading}>
            <MetricCardHeader href={databaseReportUrl} linkTooltip="Go to database report">
              <MetricCardLabel tooltip="CPU usage percentage. High values may suggest CPU-intensive queries or workloads">
                CPU
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
      </div>
    </div>
  )
}
