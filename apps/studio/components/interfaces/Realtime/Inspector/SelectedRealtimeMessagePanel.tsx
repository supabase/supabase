import type { LogData } from './Messages.types'
import {
  formatHexdump,
  isBinaryPayload,
  jsonSyntaxHighlight,
  SelectionDetailedTimestampRow,
  withBinaryPayloadPlaceholder,
} from './MessagesFormatters'

const LogsDivider = () => {
  return (
    <div className="h-px w-full bg-panel-border-interior-light in-data-[theme*=dark]:bg-panel-border-interior-dark" />
  )
}

export const SelectedRealtimeMessagePanel = ({ log }: { log: LogData }) => {
  const payload = log.metadata?.payload
  const binary = isBinaryPayload(payload)
  const envelope = withBinaryPayloadPlaceholder(log.metadata)

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
      <div className="px-8 space-y-4">
        <div>
          <h3 className="mb-4 text-sm text-foreground-lighter">Payload</h3>
          <pre className="syntax-highlight overflow-x-auto text-sm">
            <div
              className="text-wrap"
              dangerouslySetInnerHTML={{
                __html: envelope ? jsonSyntaxHighlight(envelope) : '',
              }}
            />
          </pre>
        </div>
        {binary && (
          <div>
            <h3 className="mb-4 text-sm text-foreground-lighter">Binary payload</h3>
            <pre className="overflow-x-auto whitespace-pre font-mono text-xs text-scale-1200">
              {formatHexdump(payload as ArrayBuffer | ArrayBufferView)}
            </pre>
          </div>
        )}
      </div>
    </>
  )
}
