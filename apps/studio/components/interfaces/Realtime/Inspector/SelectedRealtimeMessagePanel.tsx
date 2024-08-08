import type { LogData } from './Messages.types'
import { jsonSyntaxHighlight, SelectionDetailedTimestampRow } from './MessagesFormatters'

const LogsDivider = () => {
  return (
    <div className="h-px w-full bg-panel-border-interior-light [[data-theme*=dark]_&]:bg-panel-border-interior-dark" />
  )
}

export const SelectedRealtimeMessagePanel = ({ log }: { log: LogData }) => {
  return (
    <>
      <div className="px-8">
        <span className="col-span-4 text-sm text-scale-900">Message</span>

        <p className="text-wrap mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs text-scale-1200">
          {log.message}
        </p>
      </div>
      <LogsDivider />
      <div className="px-8 space-y-2">
        <SelectionDetailedTimestampRow hideCopy value={log.timestamp} />
      </div>
      <LogsDivider />
      <div className="px-8">
        <h3 className="mb-4 text-sm text-foreground-lighter">Metadata</h3>
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
