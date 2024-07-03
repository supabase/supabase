import { filterFunctionsRequestResponse } from 'lib/logs'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import type { PreviewLogData } from '../Logs.types'
import {
  jsonSyntaxHighlight,
  ResponseCodeFormatter,
  SelectionDetailedRow,
  SelectionDetailedTimestampRow,
} from '../LogsFormatters'

const FunctionInvocationSelectionRender = ({ log }: { log: PreviewLogData }) => {
  const metadata = log.metadata?.[0]
  const request = metadata?.request?.[0]
  const response = metadata?.response?.[0]
  const method = request?.method
  const status = response?.status_code
  const requestUrl = request?.url !== undefined ? new URL(request?.url) : undefined
  const executionTimeMs = metadata.execution_time_ms
  const deploymentId = metadata.deployment_id

  return (
    <>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <SelectionDetailedRow
          label="Status"
          value={status}
          valueRender={<ResponseCodeFormatter value={status} />}
        />
        <SelectionDetailedRow label="Method" value={method} />
        <SelectionDetailedTimestampRow value={log.timestamp} />
        <SelectionDetailedRow label="Execution Time" value={`${executionTimeMs}ms`} />
        <SelectionDetailedRow label="Execution ID" value={metadata.execution_id} />
        <SelectionDetailedRow label="Deployment ID" value={deploymentId} />
        <SelectionDetailedRow label="Log ID" value={log.id} />
        {requestUrl !== undefined && (
          <SelectionDetailedRow
            label="Request Path"
            value={requestUrl.pathname + requestUrl.search}
          />
        )}
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-lg text-foreground mb-4">Request Metadata</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: request ? jsonSyntaxHighlight(filterFunctionsRequestResponse(request)) : '',
            }}
          />
        </pre>
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-lg text-foreground mb-4">Response Metadata</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            dangerouslySetInnerHTML={{
              __html: response ? jsonSyntaxHighlight(filterFunctionsRequestResponse(response)) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export default FunctionInvocationSelectionRender
