import { X } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { formatDatabaseID } from 'data/read-replicas/replicas.utils'
import { executeSql } from 'data/sql/execute-sql-query'
import { DbQueryHook } from 'hooks/analytics/useDbQuery'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, IS_PLATFORM } from 'lib/constants'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Button, LoadingLine, cn } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { Markdown } from '../Markdown'
import { PresetHookResult } from '../Reports/Reports.utils'
import { QueryPerformanceFilterBar } from './QueryPerformanceFilterBar'
import { QueryPerformanceGrid } from './QueryPerformanceGrid'
import { QueryPerformanceChart } from './QueryPerformanceChart/QueryPerformanceChart'
import { getPgStatMonitorLogsQuery } from './QueryPerformanceChart/QueryPerformanceChart.constants'
import {
  parsePgStatMonitorLogs,
  transformLogsToChartData,
  aggregateLogsByQuery,
} from './QueryPerformanceData.utils'

dayjs.extend(utc)

interface QueryPerformanceProps {
  queryHitRate: PresetHookResult
  queryPerformanceQuery: DbQueryHook<any>
  queryMetrics: PresetHookResult
  dateRange?: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval: string
  }
  onDateRangeChange?: (from: string, to: string) => void
}

export const QueryPerformance = ({
  queryHitRate,
  queryPerformanceQuery,
  queryMetrics,
  dateRange,
  onDateRangeChange,
}: QueryPerformanceProps) => {
  const { ref } = useParams()
  const { ref: projectRef } = useParams() as { ref: string }
  const { data: project } = useSelectedProjectQuery()
  const state = useDatabaseSelectorStateSnapshot()

  const { isLoading, isRefetching } = queryPerformanceQuery
  const isPrimaryDatabase = state.selectedDatabaseId === ref
  const formattedDatabaseId = formatDatabaseID(state.selectedDatabaseId ?? '')

  const [showResetgPgStatStatements, setShowResetgPgStatStatements] = useState(false)
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)

  const [showBottomSection, setShowBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.QUERY_PERF_SHOW_BOTTOM_SECTION,
    true
  )

  // Fetch pg_stat_monitor logs
  const effectiveDateRange = useMemo(() => {
    if (dateRange) {
      return {
        iso_timestamp_start: dateRange.period_start.date,
        iso_timestamp_end: dateRange.period_end.date,
      }
    }
    // Fallback to default 24 hours
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

  const pgStatMonitorLogs = useLogsQuery(projectRef, {
    sql: queryWithTimeRange,
    iso_timestamp_start: effectiveDateRange.iso_timestamp_start,
    iso_timestamp_end: effectiveDateRange.iso_timestamp_end,
  })

  const { logData, isLoading: isLogsLoading, error: logsError } = pgStatMonitorLogs

  // Parse and process logs
  const parsedLogs = useMemo(() => {
    return parsePgStatMonitorLogs(logData || [])
  }, [logData])

  const chartData = useMemo(() => {
    return transformLogsToChartData(parsedLogs)
  }, [parsedLogs])

  console.log(
    '⚡️ Cache Stats:',
    chartData.map((d) => ({
      timestamp: d.timestamp,
      cache_hits: d.cache_hits,
      cache_misses: d.cache_misses,
      hit_rate: ((d.cache_hits / (d.cache_hits + d.cache_misses)) * 100).toFixed(2) + '%',
    }))
  )

  const aggregatedGridData = useMemo(() => {
    return aggregateLogsByQuery(parsedLogs)
  }, [parsedLogs])

  const handleRefresh = () => {
    queryPerformanceQuery.runQuery()
    queryHitRate.runQuery()
    queryMetrics.runQuery()
    pgStatMonitorLogs.runQuery()
  }

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  const handleSelectQuery = (query: string) => {
    setSelectedQuery((prev) => (prev === query ? null : query))
  }

  useEffect(() => {
    state.setSelectedDatabaseId(ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

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
      <QueryPerformanceFilterBar aggregatedData={aggregatedGridData} />
      <LoadingLine loading={isLoading || isRefetching || isLogsLoading} />

      <QueryPerformanceGrid
        aggregatedData={aggregatedGridData}
        isLoading={isLogsLoading}
        currentSelectedQuery={selectedQuery}
        onCurrentSelectQuery={handleSelectQuery}
      />

      <div
        className={cn('px-6 py-6 flex gap-x-4 border-t relative', {
          hidden: showBottomSection === false,
        })}
      >
        <Button
          className="absolute top-1.5 right-3 px-1.5"
          type="text"
          size="tiny"
          onClick={() => setShowBottomSection(false)}
        >
          <X size="14" />
        </Button>
        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>Reset report</p>
          <p className="text-xs text-foreground-light">
            Consider resetting the analysis after optimizing any queries
          </p>
          <Button
            type="default"
            className="!mt-3 w-min"
            onClick={() => setShowResetgPgStatStatements(true)}
          >
            Reset report
          </Button>
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>How is this report generated?</p>
          <Markdown
            className="text-xs"
            content={`This report uses the pg_stat_statements table, and pg_stat_statements extension. [Learn more here](${DOCS_URL}/guides/platform/performance#examining-query-performance).`}
          />
        </div>

        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>Inspect your database for potential issues</p>
          <Markdown
            className="text-xs"
            content={`The Supabase CLI comes with a range of tools to help inspect your Postgres instances for
            potential issues. [Learn more here](${DOCS_URL}/guides/database/inspect).`}
          />
        </div>
      </div>

      <ConfirmationModal
        visible={showResetgPgStatStatements}
        size="medium"
        variant="destructive"
        title="Reset query performance analysis"
        confirmLabel="Reset report"
        confirmLabelLoading="Resetting report"
        onCancel={() => setShowResetgPgStatStatements(false)}
        onConfirm={async () => {
          const connectionString = databases?.find(
            (db) => db.identifier === state.selectedDatabaseId
          )?.connectionString

          if (IS_PLATFORM && !connectionString) {
            return toast.error('Unable to run query: Connection string is missing')
          }

          try {
            await executeSql({
              projectRef: project?.ref,
              connectionString,
              sql: `SELECT pg_stat_statements_reset();`,
            })
            handleRefresh()
            setShowResetgPgStatStatements(false)
          } catch (error: any) {
            toast.error(`Failed to reset analysis: ${error.message}`)
          }
        }}
      >
        <p className="text-foreground-light text-sm">
          This will reset the pg_stat_statements table in the extensions schema on your{' '}
          <span className="text-foreground">
            {isPrimaryDatabase ? 'primary database' : `read replica (ID: ${formattedDatabaseId})`}
          </span>
          , which is used to calculate query performance. This data will repopulate immediately
          after.
        </p>
      </ConfirmationModal>
    </>
  )
}
