import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  MetricCard,
  MetricCardContent,
  MetricCardHeader,
  MetricCardLabel,
  MetricCardValue,
} from 'ui-patterns/MetricCard'

import {
  DatabaseInfrastructureMetric,
  INFRASTRUCTURE_METRIC_ATTRIBUTES,
} from './DatabaseInfrastructureMetric'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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

  const infraQuery = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: INFRASTRUCTURE_METRIC_ATTRIBUTES,
    startDate,
    endDate,
    interval: infraInterval,
  })

  const maxConnectionsQuery = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

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
        <Link
          href={`/project/${projectRef}/observability/query-performance?totalTimeFilter=${encodeURIComponent(JSON.stringify({ operator: '>', value: 1000 }))}`}
          className="block group"
        >
          <MetricCard isLoading={slowQueriesLoading}>
            <MetricCardHeader linkTooltip="Go to query performance">
              <MetricCardLabel tooltip="Queries with total execution time (execution time + planning time) greater than 1000ms. High values may indicate query optimization opportunities">
                Slow Queries
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue>{slowQueriesCount}</MetricCardValue>
            </MetricCardContent>
          </MetricCard>
        </Link>

        {(['connections', 'disk', 'diskIo', 'ram', 'cpu'] as const).map((metric) => (
          <DatabaseInfrastructureMetric
            key={metric}
            metric={metric}
            infraQuery={infraQuery}
            href={databaseReportUrl}
            maxConnectionsQuery={maxConnectionsQuery}
          />
        ))}
      </div>
    </div>
  )
}
