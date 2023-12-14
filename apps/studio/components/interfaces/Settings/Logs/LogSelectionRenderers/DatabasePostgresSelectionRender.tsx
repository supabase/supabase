import { Alert } from 'ui'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import LogsDivider from '../Logs.Divider'
import {
  jsonSyntaxHighlight,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
  SeverityFormatter,
} from '../LogsFormatters'

const DatabasePostgresSelectionRender = ({ log }: any) => {
  const postgresUsername = log?.metadata[0]?.parsed[0]?.user_name
  const sessionId = log?.metadata[0]?.parsed[0]?.session_id
  const hint = log?.metadata[0]?.parsed[0]?.hint
  const errorSeverity = log?.metadata[0]?.parsed[0]?.error_severity

  return (
    <>
      <div className={LOGS_TAILWIND_CLASSES.log_selection_x_padding}>
        <span className="col-span-4 text-sm text-foreground-lighter">Event message</span>

        <div className="text-wrap mt-2 overflow-x-auto whitespace-pre-wrap font-mono  text-xs text-foreground">
          {log.event_message}
        </div>
      </div>
      <LogsDivider />
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <SelectionDetailedRow
          label="Severity"
          value={errorSeverity}
          valueRender={<SeverityFormatter value={errorSeverity} />}
        />
        <SelectionDetailedTimestampRow value={log.timestamp} />
        <SelectionDetailedRow label="Postgres Username" value={postgresUsername} />
        <SelectionDetailedRow label="Session ID" value={sessionId} />
      </div>
      {hint && (
        <div className={`mt-4 ${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
          <Alert variant="warning" withIcon title={hint} />
        </div>
      )}
      <LogsDivider />
      <div className={LOGS_TAILWIND_CLASSES.log_selection_x_padding}>
        <h3 className="mb-4 text-lg text-foreground">Metadata</h3>
        <pre className="syntax-highlight overflow-x-auto text-sm">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: log.metadata ? jsonSyntaxHighlight(log.metadata[0]) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export const DatabaseApiSelectionHeaderRender = (log: any) => {
  const method = log?.metadata[0]?.request[0]?.method
  const path = log?.metadata[0]?.request[0]?.path

  return `${method} ${path}`
}

export default DatabasePostgresSelectionRender
