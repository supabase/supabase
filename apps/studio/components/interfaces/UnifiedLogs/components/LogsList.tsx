import CopyButton from 'components/ui/CopyButton'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { HoverCardTimestamp } from './HoverCardTimestamp'

interface LogEntry {
  id: string
  timestamp: string
  event_message: string
  level: string
  event_type: string
}

interface LogsListProps {
  logs?: LogEntry[]
}

export const LogsList = ({ logs = [] }: LogsListProps) => {
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
            <div key={log.id} className="group py-1.5 px-4 border-b border-border last:border-0">
              <div className="flex items-start gap-5">
                <div className="flex flex-row items-center gap-5 flex-shrink-0">
                  <HoverCardTimestamp date={date} className="flex-shrink-0" />
                  <DataTableColumnStatusCode
                    value={log.level}
                    level={log.level}
                    className="min-w-20 flex-shrink-0"
                  />
                </div>
                <div className="w-full grow relative mt-1 whitespace-pre-wrap break-all pl-2 text-[0.75rem] flex-shrink-0">
                  {message.map((x, i) => (
                    <pre key={`message-${i}`} className="font-mono w-full">
                      {x}
                    </pre>
                  ))}
                  <CopyButton
                    iconOnly
                    type="default"
                    text={log.event_message}
                    className="absolute top-[5px] right-2 z-10 opacity-0 group-hover:opacity-100 transition"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
