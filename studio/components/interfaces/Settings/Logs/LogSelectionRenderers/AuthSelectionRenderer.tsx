import { parse } from 'crypto-js/enc-utf8'
import { isUnixMicro, PreviewLogData, unixMicroToIsoTimestamp } from '..'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import {
  jsonSyntaxHighlight,
  ResponseCodeFormatter,
  SelectionDetailedRow,
  SeverityFormatter,
} from '../LogsFormatters'

export interface AuthEventParsed extends Record<string, string | number> {
  component: string
  error: string
  method: string
  level: string
  msg: string
  path: string
  status: number
}
const AuthSelectionRenderer = ({ log }: { log: PreviewLogData }) => {
  let parsed: AuthEventParsed | undefined
  try {
    parsed = JSON.parse(log.event_message.trim())
  } catch (_e) {
    // do nothing
  }
  return (
    <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-scale-900 text-sm">Event Message</h3>
        <div className="text-xs text-wrap font-mono text-scale-1200 whitespace-pre-wrap overflow-x-auto">
          {parsed?.msg || log.event_message}
        </div>
      </div>

      <SelectionDetailedRow
        label="ISO Timestamp"
        value={
          isUnixMicro(log.timestamp)
            ? unixMicroToIsoTimestamp(log.timestamp)
            : String(log.timestamp)
        }
      />
      {parsed?.status && (
        <SelectionDetailedRow
          label="Status"
          value={String(parsed.status)}
          valueRender={<ResponseCodeFormatter value={parsed.status} />}
        />
      )}
      {parsed?.level && (
        <SelectionDetailedRow
          label="Severity"
          value={parsed.level}
          valueRender={<SeverityFormatter value={parsed.level} />}
        />
      )}
      {parsed?.path && <SelectionDetailedRow label="Request Path" value={parsed.path} />}
      {parsed?.error && <SelectionDetailedRow label="Error Message" value={parsed.error} />}

      <div className="flex flex-col gap-3">
        <h3 className="text-scale-900 text-sm">Metadata</h3>
        <pre
          className=" className={`text-scale-1200 text-sm col-span-8 overflow-x-auto text-xs font-mono`}"
          dangerouslySetInnerHTML={{
            __html: jsonSyntaxHighlight(parsed || log.metadata!),
          }}
        />
      </div>
    </div>
  )
}

export default AuthSelectionRenderer
