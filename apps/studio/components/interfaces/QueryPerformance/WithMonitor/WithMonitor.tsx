import { QueryPerformanceGrid } from '../QueryPerformanceGrid'
import { LoadingLine } from 'ui'
import { QueryPerformanceChart } from '../QueryPerformanceChart'
import { QueryPerformanceFilterBar } from '../QueryPerformanceFilterBar'
import { useMemo, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { getPgStatMonitorLogsQuery } from '../QueryPerformance.constants'
import {
  parsePgStatMonitorLogs,
  transformLogsToChartData,
  aggregateLogsByQuery,
} from './WithMonitor.utils'
import { useParams } from 'common'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { captureQueryPerformanceError } from '../QueryPerformance.utils'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { getErrorMessage } from 'lib/get-error-message'

dayjs.extend(utc)

interface WithMonitorProps {
  dateRange?: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval: string
  }
  onDateRangeChange?: (from: string, to: string) => void
}

export const WithMonitor = ({ dateRange, onDateRangeChange }: WithMonitorProps) => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)

  // [kemal]: Fetch pg_stat_monitor logs. This will need to change when we move to the actual extension.
  const effectiveDateRange = useMemo(() => {
    if (dateRange) {
      return {
        iso_timestamp_start: dateRange.period_start.date,
        iso_timestamp_end: dateRange.period_end.date,
      }
    }

    // [kemal]: Fallback to default 24 hours
    const end = dayjs.utc()
    const start = end.subtract(24, 'hours')
    return {
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    }
  }, [dateRange])

  const queryWithTimeRange = useMemo(() => {
    return getPgStatMonitorLogsQuery(
      effectiveDateRange.iso_timestamp_start,
      effectiveDateRange.iso_timestamp_end
    )
  }, [effectiveDateRange])

  const pgStatMonitorLogs = useLogsQuery(ref as string, {
    sql: queryWithTimeRange,
    iso_timestamp_start: effectiveDateRange.iso_timestamp_start,
    iso_timestamp_end: effectiveDateRange.iso_timestamp_end,
  })

  const { logData, isLoading: isLogsLoading, error: logsError } = pgStatMonitorLogs

  const parsedLogs = useMemo(() => {
    return parsePgStatMonitorLogs(logData || [])
  }, [logData])

  const chartData = useMemo(() => {
    return transformLogsToChartData(parsedLogs)
  }, [parsedLogs])

  const aggregatedGridData = useMemo(() => {
    return aggregateLogsByQuery(parsedLogs)
  }, [parsedLogs])

  const handleSelectQuery = (query: string) => {
    setSelectedQuery((prev) => (prev === query ? null : query))
  }

  const handleRetry = () => {
    pgStatMonitorLogs.runQuery()
  }

  useEffect(() => {
    if (logsError) {
      const errorMessage = getErrorMessage(logsError)
      captureQueryPerformanceError(logsError, {
        projectRef: ref,
        databaseIdentifier: state.selectedDatabaseId,
        queryPreset: 'pg_stat_monitor',
        queryType: 'monitor',
        postgresVersion: project?.dbVersion,
        databaseType: state.selectedDatabaseId === ref ? 'primary' : 'read-replica',
        sql: queryWithTimeRange,
        errorMessage: errorMessage || undefined,
      })
    }
  }, [logsError, ref, state.selectedDatabaseId, project?.dbVersion, queryWithTimeRange])

  return (
    <>
      <QueryPerformanceChart
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        chartData={chartData}
        isLoading={isLogsLoading}
        error={logsError}
        currentSelectedQuery={selectedQuery}
        parsedLogs={parsedLogs}
      />
      <QueryPerformanceFilterBar
        actions={
          <DownloadResultsButton
            results={aggregatedGridData}
            fileName={`Supabase Query Performance Monitor (${ref})`}
            align="end"
          />
        }
      />
      <LoadingLine loading={isLogsLoading} />
      <QueryPerformanceGrid
        aggregatedData={aggregatedGridData}
        isLoading={isLogsLoading}
        error={
          logsError ? getErrorMessage(logsError) || 'Failed to load query performance data' : null
        }
        currentSelectedQuery={selectedQuery}
        onCurrentSelectQuery={handleSelectQuery}
        onRetry={handleRetry}
      />
    </>
  )
}
