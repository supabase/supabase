import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import {
  jsonSyntaxHighlight,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
  SeverityFormatter,
} from '../LogsFormatters'

const FunctionLogsSelectionRender = ({ log }: any) => {
  const metadata = log.metadata[0]

  return (
    <>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <span className="text-foreground-lighter text-sm col-span-4">Event message</span>
        <div className="text-xs text-wrap font-mono text-foreground mt-2 whitespace-pre-wrap overflow-x-auto">
          {log.event_message}
        </div>
      </div>
      <div className="h-px w-full bg-panel-border-interior-light dark:bg-panel-border-interior-dark"></div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <SelectionDetailedRow
          label="Severity"
          value={metadata.level}
          valueRender={<SeverityFormatter value={metadata.level} />}
        />
        <SelectionDetailedRow label="Deployment version" value={metadata.version} />
        <SelectionDetailedTimestampRow value={log.timestamp} />
        <SelectionDetailedRow label="Execution ID" value={metadata.execution_id} />
        <SelectionDetailedRow label="Deployment ID" value={metadata.deployment_id} />
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-lg text-foreground mb-4">Metadata</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: metadata ? jsonSyntaxHighlight(metadata) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export default FunctionLogsSelectionRender
