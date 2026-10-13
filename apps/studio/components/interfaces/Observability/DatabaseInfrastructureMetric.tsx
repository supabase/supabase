import type { UseQueryResult } from '@tanstack/react-query'
import Link from 'next/link'
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
import {
  type InfraMonitoringAttribute,
  type InfraMonitoringError,
  type InfraMonitoringMultiData,
} from '@/data/analytics/infra-monitoring-query'
import type { MaxConnectionsData, MaxConnectionsError } from '@/data/database/max-connections-query'

const METRICS = {
  connections: {
    label: 'Peak Connections',
    tooltip:
      'Highest concurrent database connections observed in the selected window, against the connection limit. Monitor to avoid connection exhaustion.',
    attributes: ['pg_stat_database_num_backends'],
  },
  disk: {
    label: 'Disk Usage',
    tooltip: 'Disk usage percentage of total disk space used',
    attributes: ['disk_fs_used_system', 'disk_fs_used_wal', 'pg_database_size', 'disk_fs_size'],
  },
  diskIo: {
    label: 'Disk IO',
    tooltip: 'Disk I/O consumption percentage. High values may indicate disk bottlenecks',
    attributes: ['disk_io_consumption'],
  },
  ram: {
    label: 'Memory',
    tooltip: 'RAM usage percentage. Sustained high usage may indicate memory pressure',
    attributes: ['ram_usage'],
  },
  cpu: {
    label: 'CPU',
    tooltip: 'CPU usage percentage. High values may suggest CPU-intensive queries or workloads',
    attributes: ['avg_cpu_usage'],
  },
} satisfies Record<
  string,
  { label: string; tooltip: string; attributes: InfraMonitoringAttribute[] }
>

export const INFRASTRUCTURE_METRIC_ATTRIBUTES = Object.values(METRICS).flatMap(
  ({ attributes }) => attributes
)

type DatabaseInfrastructureMetricProps = {
  infraQuery: Pick<
    UseQueryResult<InfraMonitoringMultiData, InfraMonitoringError>,
    'data' | 'error' | 'isLoading'
  >
  metric: keyof typeof METRICS
  href: string
  maxConnectionsQuery: Pick<
    UseQueryResult<MaxConnectionsData, MaxConnectionsError>,
    'data' | 'error' | 'isLoading'
  >
}

export const DatabaseInfrastructureMetric = ({
  metric,
  href,
  maxConnectionsQuery,
  infraQuery,
}: DatabaseInfrastructureMetricProps) => {
  const { label, tooltip, attributes } = METRICS[metric]
  const isConnections = metric === 'connections'
  const isLoading = infraQuery.isLoading || (isConnections && maxConnectionsQuery.isLoading)
  const data = infraQuery.data
  const errors = data && 'errors' in data ? data.errors : undefined
  const metricError = attributes.map((attribute) => errors?.[attribute]).find(Boolean)
  const hasMissingSeries =
    data && 'series' in data && attributes.some((attribute) => !data.series[attribute])
  const error =
    infraQuery.error ??
    metricError ??
    (isConnections ? maxConnectionsQuery.error : null) ??
    (hasMissingSeries ? { message: 'Error loading data' } : null)
  const errorMessage =
    error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Error loading data'

  let value = '--'
  if (data) {
    if (isConnections) {
      const connections = parseConnectionsData(data, maxConnectionsQuery.data)
      if (connections.max > 0) value = `${connections.peak}/${connections.max}`
    } else {
      const metrics = parseInfrastructureMetrics(data)
      if (metrics) value = `${metrics[metric].current.toFixed(0)}%`
    }
  }

  return (
    <Link href={href} className="block group">
      <MetricCard isLoading={isLoading}>
        <MetricCardHeader linkTooltip="Go to database report">
          <MetricCardLabel tooltip={tooltip}>{label}</MetricCardLabel>
        </MetricCardHeader>
        <MetricCardContent>
          {!!error && (
            <div className="text-xs text-destructive wrap-break-word">{errorMessage}</div>
          )}
          {!error && <MetricCardValue>{value}</MetricCardValue>}
        </MetricCardContent>
      </MetricCard>
    </Link>
  )
}
