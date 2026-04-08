import type { LogData } from './Messages.types'
import { jsonSyntaxHighlight, SelectionDetailedTimestampRow } from './MessagesFormatters'

const LogsDivider = () => {
  return <div className="h-px w-full bg-border-muted" />
}

export const SelectedRealtimeMessagePanel = ({ log }: { log: LogData }) => {
  return (
    <>
      <div className="px-8">
        <span className="col-span-4 text-sm text-foreground-lighter">Message</span>

        <p className="text-wrap mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-foreground">
          {log.message}
        </p>
      </div>
      <LogsDivider />
      <div className="px-8 space-y-2">
        <SelectionDetailedTimestampRow hideCopy value={log.timestamp} />
      </div>
      <LogsDivider />
      <div className="px-8">
        <h3 className="mb-4 text-sm text-foreground-lighter">Payload</h3>
        <pre className="syntax-highlight overflow-x-auto text-sm">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: log.metadata ? jsonSyntaxHighlight(log.metadata) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}
