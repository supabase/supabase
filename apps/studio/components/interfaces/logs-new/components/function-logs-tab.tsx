import React from 'react'

import { DataTableColumnStatusCode } from 'components/interfaces/DataTableDemo/components/data-table/data-table-column/data-table-column-status-code'
import { HoverCardTimestamp } from 'components/interfaces/DataTableDemo/infinite/_components/hover-card-timestamp'

interface FunctionLogEntry {
  id: string
  timestamp: string
  event_message: string
  level: string
  event_type: string
}

interface FunctionLogsTabProps {
  logs?: FunctionLogEntry[]
}

export const FunctionLogsTab: React.FC<FunctionLogsTabProps> = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-sm text-muted-foreground">No function logs found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="text-sm font-mono">
        {logs.map((log) => {
          const date = new Date(Number(log.timestamp) / 1000)
          // Map the log level to our standard levels

          return (
            <div key={log.id} className="py-1 border-b border-border last:border-0">
              <div className="flex items-start gap-5">
                <div className="flex flex-row items-center gap-5">
                  <HoverCardTimestamp date={date} className="min-w-20 ml-14" />

                  <DataTableColumnStatusCode
                    value={log.level}
                    level={log.level}
                    className="min-w-20"
                  />
                  {/* <span className="text-foreground">{log.event_type || 'Log'}</span> */}
                </div>
                <div className="mt-1 whitespace-pre-wrap break-all pl-2 text-[0.8rem]">
                  {log.event_message}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
