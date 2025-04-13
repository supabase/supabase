import { LogData } from 'components/interfaces/Settings/Logs/Logs.types'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

interface UnifiedLogsColumnRenderProps {
  log: LogData & {
    log_type: string
    metadata: any
    path?: string
    method?: string
    code?: string
    level?: string
  }
}

export const UnifiedLogsColumnRender = ({ log }: UnifiedLogsColumnRenderProps) => {
  const { log_type, metadata, event_message } = log

  // Default values
  let logLevel = log.level || 'OK'
  let logPath = log.path || ''
  let logMethod = log.method || ''
  let logCode = log.code || ''

  // Extract fields from metadata based on log_type
  if (log_type === 'edge') {
    // Extract from edge logs metadata
    const request = metadata?.[0]?.request?.[0]
    const response = metadata?.[0]?.response?.[0]

    // Determine level based on status code
    if (logCode) {
      const statusCode = parseInt(logCode, 10)
      if (!isNaN(statusCode)) {
        if (statusCode >= 500) logLevel = 'ERROR'
        else if (statusCode >= 400) logLevel = 'WARN'
      }
    }
  }

  // Add more log_type handlers as needed

  // console.log('UnifiedLogsColumnRender metadata:', metadata)
  // console.log('Extracted fields:', { method, path, code, level })

  return (
    <div className="flex flex-row gap-3 items-center" key={log.id}>
      <div className="flex items-center gap-2">
        <TimestampInfo utcTimestamp={log.timestamp} />
        {logLevel && (
          <span
            className={`text-xs ${
              logLevel === 'ERROR'
                ? 'text-red-500'
                : logLevel === 'WARN'
                  ? 'text-yellow-500'
                  : 'text-green-500'
            }`}
          >
            {logLevel}
          </span>
        )}
        <span className="text-xs text-foreground-light">{log_type}</span>
        {logCode && <span className="text-xs text-foreground-light">{logCode}</span>}
      </div>
      {logPath && <div className="text-xs text-foreground-light">{logPath}</div>}
      {logMethod && <div className="text-xs text-foreground-light">{logMethod}</div>}
      <div className="text-sm">{event_message}</div>
    </div>
  )
}
