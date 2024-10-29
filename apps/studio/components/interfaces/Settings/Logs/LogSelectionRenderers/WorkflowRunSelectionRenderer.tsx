import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import {
  IDFormatter,
  jsonSyntaxHighlight,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
} from '../LogsFormatters'

const WorkflowRunSelectionRenderer = ({
  log,
}: {
  log: {
    event_message: string
    timestamp: number
    id: string
    workflow_run?: string
  }
}) => {
  return (
    <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-foreground-lighter text-sm">Event Message</h3>
        <div className="text-xs text-wrap font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
          {log.event_message}
        </div>
      </div>

      <SelectionDetailedTimestampRow value={log.timestamp} />
      {log.workflow_run && (
        <SelectionDetailedRow
          label="Workflow Run ID"
          value={String(log.workflow_run)}
          valueRender={<IDFormatter value={log.workflow_run} />}
        />
      )}
    </div>
  )
}

export default WorkflowRunSelectionRenderer
