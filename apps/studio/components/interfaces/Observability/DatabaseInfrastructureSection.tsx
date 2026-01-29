import { useParams } from 'common'
import NoDataPlaceholder from 'components/ui/Charts/NoDataPlaceholder'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from 'data/database/max-connections-query'
import dayjs from 'dayjs'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Loading, cn } from 'ui'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import {
  MetricCard,
  MetricCardContent,
  MetricCardHeader,
  MetricCardLabel,
  MetricCardValue,
} from 'ui-patterns/MetricCard'

import type { LogsBarChartDatum } from '../HomeNew/ProjectUsage.metrics'
import {
  getMetricStatusColor,
  parseConnectionsData,
  parseInfrastructureMetrics,
} from './DatabaseInfrastructureSection.utils'

type DatabaseInfrastructureSectionProps = {
  interval: '1hr' | '1day' | '7day'
  refreshKey: number
  dbErrorRate: number
  dbChartData: LogsBarChartDatum[]
  dbErrorCount: number
  dbWarningCount: number
  isLoading: boolean
  onBarClick: (datum: unknown) => void
  datetimeFormat: string
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

  return (
    <div>
      <h2 className="mb-4">Database</h2>
      {/* First row: Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard isLoading={dbLoading}>
          <MetricCardHeader>
            <MetricCardLabel tooltip="Percentage of database operations resulting in errors or warnings">
              Error Rate
            </MetricCardLabel>
          </MetricCardHeader>
          <MetricCardContent>
            <MetricCardValue>{dbErrorRate.toFixed(1)}%</MetricCardValue>
          </MetricCardContent>
        </MetricCard>

        <MetricCard isLoading={slowQueriesLoading}>
          <MetricCardHeader href={`/project/${projectRef}/observability/query-performance`}>
            <MetricCardLabel tooltip="Queries with total execution time (execution time + planning time) greater than 1000ms. High values may indicate query optimization opportunities">
              Slow Queries
            </MetricCardLabel>
          </MetricCardHeader>
          <MetricCardContent>
            <MetricCardValue>{slowQueriesCount}</MetricCardValue>
          </MetricCardContent>
        </MetricCard>

        <MetricCard isLoading={infraLoading}>
          <MetricCardHeader>
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

        <MetricCard isLoading={infraLoading}>
          <MetricCardHeader>
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

        <MetricCard isLoading={infraLoading}>
          <MetricCardHeader>
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

        <MetricCard isLoading={infraLoading}>
          <MetricCardHeader>
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
      </div>
    </div>
  )
}
