import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { useParams } from 'common'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { getSupamonitorLogsQuery } from './QueryInsights.constants'
import {
  parseSupamonitorLogs,
  filterSystemLogs,
  transformLogsToChartData,
  aggregateLogsByQuery,
} from './utils/supamonitor.utils'

import { QueryInsightsHealth } from './QueryInsightsHealth/QueryInsightsHealth'
import { QueryInsightsChart } from './QueryInsightsChart/QueryInsightsChart'
import { QueryInsightsTable } from './QueryInsightsTable/QueryInsightsTable'
import { useSupamonitorIndexAdvisor } from './hooks/useSupamonitorIndexAdvisor'

dayjs.extend(utc)

interface QueryInsightsProps {
  dateRange?: {
    period_start: { date: string; time_period: string }
    period_end: { date: string; time_period: string }
    interval: string
  }
}

export const QueryInsights = ({ dateRange }: QueryInsightsProps) => {
  const { ref } = useParams()

  const effectiveDateRange = useMemo(() => {
    if (dateRange) {
      return {
        iso_timestamp_start: dateRange.period_start.date,
        iso_timestamp_end: dateRange.period_end.date,
      }
    }
    const end = dayjs.utc()
    const start = end.subtract(1, 'hour')
    return {
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    }
  }, [dateRange])

  const sql = useMemo(
    () =>
      getSupamonitorLogsQuery(
        effectiveDateRange.iso_timestamp_start,
        effectiveDateRange.iso_timestamp_end
      ),
    [effectiveDateRange]
  )

  const { logData, isLoading } = useLogsQuery(ref as string, {
    sql,
    iso_timestamp_start: effectiveDateRange.iso_timestamp_start,
    iso_timestamp_end: effectiveDateRange.iso_timestamp_end,
  })

  const [selectedQuery, setSelectedQuery] = useState<string | null>(null)

  const parsedLogs = useMemo(() => parseSupamonitorLogs(logData || []), [logData])
  const filteredLogs = useMemo(() => filterSystemLogs(parsedLogs), [parsedLogs])
  const chartData = useMemo(() => transformLogsToChartData(filteredLogs), [filteredLogs])
  const selectedChartData = useMemo(
    () =>
      selectedQuery
        ? transformLogsToChartData(
            filteredLogs.filter((log) => log.query?.replace(/\s+/g, ' ').trim() === selectedQuery)
          )
        : undefined,
    [filteredLogs, selectedQuery]
  )
  const aggregatedData = useMemo(() => aggregateLogsByQuery(filteredLogs), [filteredLogs])
  const enrichedData = useSupamonitorIndexAdvisor(aggregatedData)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <QueryInsightsHealth data={enrichedData} isLoading={isLoading} />
      <QueryInsightsChart
        chartData={chartData}
        selectedChartData={selectedChartData}
        isLoading={isLoading}
      />
      <QueryInsightsTable
        data={enrichedData}
        isLoading={isLoading}
        currentSelectedQuery={selectedQuery}
        onCurrentSelectQuery={setSelectedQuery}
      />
    </div>
  )
}
