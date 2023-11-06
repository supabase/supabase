import { PreviewLogData } from '..'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import {
  jsonSyntaxHighlight,
  ResponseCodeFormatter,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
  SeverityFormatter,
} from '../LogsFormatters'

const AuthSelectionRenderer = ({ log }: { log: PreviewLogData }) => {
  return (
    <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">Event Message</h3>
        <div className="text-xs text-wrap font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
          {log.metadata?.msg || log.event_message}
        </div>
      </div>

      <SelectionDetailedTimestampRow value={log.timestamp} />
      {log.metadata?.status && (
        <SelectionDetailedRow
          label="Status"
          value={String(log.metadata?.status)}
          valueRender={<ResponseCodeFormatter value={log.metadata?.status} />}
        />
      )}
      {log.metadata?.level && (
        <SelectionDetailedRow
          label="Severity"
          value={log.metadata?.level}
          valueRender={<SeverityFormatter value={log.metadata?.level} />}
        />
      )}
      {log.metadata?.path && (
        <SelectionDetailedRow label="Request Path" value={log.metadata?.path} />
      )}
      {log.metadata?.error && (
        <SelectionDetailedRow label="Error Message" value={log.metadata?.error} />
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">Metadata</h3>
        <pre
          className=" className={`text-foreground text-sm col-span-8 overflow-x-auto text-xs font-mono`}"
          dangerouslySetInnerHTML={{
            __html: jsonSyntaxHighlight(log.metadata!),
          }}
        />
      </div>
    </div>
  )
}

export default AuthSelectionRenderer
