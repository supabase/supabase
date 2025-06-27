import CopyButton from 'components/ui/CopyButton'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { HoverCardTimestamp } from './HoverCardTimestamp'

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

export const FunctionLogsTab = ({ logs = [] }: FunctionLogsTabProps) => {
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
          const message = log.event_message.split('\n').filter((x) => x.length > 0)

          return (
            <div
              key={log.id}
              className="pl-5 py-2 border-b border-border last:border-0 relative group"
            >
              <CopyButton
                iconOnly
                type="default"
                text={log.event_message}
                className="absolute top-[5px] right-2 z-10 opacity-0 group-hover:opacity-100 transition"
              />
              <div className="flex items-start gap-5">
                <div className="flex flex-row items-center gap-2">
                  <HoverCardTimestamp date={date} className="min-w-28" />
                  <DataTableColumnStatusCode
                    value={log.level}
                    level={log.level}
                    className="min-w-10"
                  />
                </div>
                <div className="text-[0.8rem] overflow-x-auto mt-0.5 relative">
                  {message.map((x, i) => (
                    <pre key={`message-${i}`} className="font-mono text-xs">
                      {x}
                    </pre>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
