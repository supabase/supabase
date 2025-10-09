import { useState, useMemo, useEffect } from 'react'

import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import {
  QUERY_PERFORMANCE_CHART_TABS,
  PG_STAT_MONITOR_LOGS_QUERY,
} from './QueryPerformanceChart.constants'
import { transformLogsToJSON } from './QueryPerformanceChart.utils'
import useLogsQuery from 'hooks/analytics/useLogsQuery'
import { useParams } from 'common'
import { Loader2 } from 'lucide-react'

export const QueryPerformanceChart = () => {
  const [selectedMetric, setSelectedMetric] = useState('query_latency')

  const { ref: projectRef } = useParams() as { ref: string }

  const pgStatMonitorLogs = useLogsQuery(projectRef, {
    sql: PG_STAT_MONITOR_LOGS_QUERY,
    iso_timestamp_start: '2025-10-09T00:00:00Z',
    iso_timestamp_end: '2025-10-09T23:59:59Z',
  })

  const { logData, isLoading, error } = pgStatMonitorLogs

  const parsedLogs = useMemo(() => {
    if (!logData || logData.length === 0) return []

    const validParsedLogs = logData
      .map((log) => ({
        ...log,
        parsedEventMessage: transformLogsToJSON(log.event_message),
      }))
      .filter((log) => log.parsedEventMessage !== null)

    console.log(`Successfully parsed: ${validParsedLogs.length}/${logData.length}`)

    return validParsedLogs.map((log) => log.parsedEventMessage)
  }, [logData])

  useEffect(() => {
    if (parsedLogs.length > 0) {
      console.log('Parsed logs updated:', parsedLogs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedLogs.length])

  return (
    <div className="bg-surface-200 border-t">
      <Tabs_Shadcn_
        value={selectedMetric}
        onValueChange={(value) => setSelectedMetric(value as string)}
        className="w-full"
      >
        <TabsList_Shadcn_ className="flex justify-start rounded-none gap-x-4 border-b !mt-0 pt-0 px-6">
          {QUERY_PERFORMANCE_CHART_TABS.map((tab) => (
            <TabsTrigger_Shadcn_
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
            >
              {tab.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        <TabsContent_Shadcn_ value={selectedMetric} className="bg-surface-100 mt-0 h-inherit">
          <div className="w-full flex items-center justify-center h-[248px]">
            {isLoading ? (
              <Loader2 className="size-5 animate-spin text-foreground-light" />
            ) : error ? (
              <p className="text-sm text-foreground-light text-center h-full flex items-center justify-center">
                Error loading chart data
              </p>
            ) : (
              <div>Chart here...</div>
            )}
          </div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}
