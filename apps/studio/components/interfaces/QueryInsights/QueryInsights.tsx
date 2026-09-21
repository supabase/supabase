import { useQuery } from '@tanstack/react-query'
import { FeatureFlagContext, useFlag, useParams } from 'common'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useContext, useMemo, useState } from 'react'

import { useSupamonitorIndexAdvisor } from './hooks/useSupamonitorIndexAdvisor'
import { QueryInsightsChart } from './QueryInsightsChart/QueryInsightsChart'
import { QueryInsightsHealth } from './QueryInsightsHealth/QueryInsightsHealth'
import { QueryInsightsTable } from './QueryInsightsTable/QueryInsightsTable'
import {
  aggregateLogsByQuery,
  filterSystemLogs,
  parseSupamonitorLogs,
  transformLogsToChartData,
} from './utils/supamonitor.utils'
import { queryInsightsQueryOptions } from '@/data/query-insights/query-insights-query'
import { IS_PLATFORM } from '@/lib/constants'

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
  const flagUseOtel = useFlag('otelLegacyLogs')
  const { hasLoaded: hasLoadedFlags } = useContext(FeatureFlagContext)
  const useOtel = IS_PLATFORM && Boolean(flagUseOtel)
  const projectRef = IS_PLATFORM ? ref : (ref ?? 'default')
  const isQueryReady = !IS_PLATFORM || hasLoadedFlags === true

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

  const queryOptions = queryInsightsQueryOptions({
    projectRef,
    isoTimestampStart: effectiveDateRange.iso_timestamp_start,
    isoTimestampEnd: effectiveDateRange.iso_timestamp_end,
    useOtel,
  })
  const { data: logData, isPending: isLoading } = useQuery({
    ...queryOptions,
    enabled: queryOptions.enabled && isQueryReady,
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
