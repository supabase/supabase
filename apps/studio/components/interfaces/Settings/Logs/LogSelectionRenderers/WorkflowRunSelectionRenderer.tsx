import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import type { PreviewLogData } from '../Logs.types'
import {
  IDFormatter,
  jsonSyntaxHighlight,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
} from '../LogsFormatters'

const WorkflowRunSelectionRenderer = ({ log }: { log: PreviewLogData }) => {
  console.log('log:', log)
  return (
    <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">Event Message</h3>
        <div className="text-xs text-wrap font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
          {log.metadata?.msg || log.event_message}
        </div>
      </div>

      <SelectionDetailedTimestampRow value={log.timestamp} />
      {log.metadata?.workflow_run && (
        <SelectionDetailedRow
          label="Workflow Run ID"
          value={String(log.metadata?.workflow_run)}
          valueRender={<IDFormatter value={log.metadata?.workflow_run} />}
        />
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">Metadata</h3>
        <pre
          className=" className={`text-foreground col-span-8 overflow-x-auto text-xs font-mono`}"
          dangerouslySetInnerHTML={{
            __html: jsonSyntaxHighlight(log.metadata!),
          }}
        />
      </div>
    </div>
  )
}

export default WorkflowRunSelectionRenderer
