import dayjs from 'dayjs'
import { filterFunctionsRequestResponse } from 'lib/logs'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight, ResponseCodeFormatter } from '../LogsFormatters'

const FunctionInvocationSelectionRender = ({ log }: any) => {
  const request = log?.request
  const response = log?.response
  const method = log?.method
  const status = log?.status_code
  const requestUrl = new URL(request?.url)
  const executionTimeMs = log?.execution_time_ms
  const timestamp = dayjs(log.timestamp / 1000)

  const DetailedRow = ({
    label,
    value,
    code,
  }: {
    label: string
    value: string | React.ReactNode
    code?: boolean
  }) => {
    return (
      <div className="grid grid-cols-12">
        <span className="text-scale-900 text-sm col-span-4 whitespace-pre-wrap">{label}</span>
        <span
          className={`text-scale-1200 text-sm col-span-8 whitespace-pre-wrap ${
            code && 'text-xs font-mono'
          }`}
        >
          {value}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <DetailedRow label="Status" value={<ResponseCodeFormatter value={status} />} />
        <DetailedRow label="Method" value={method} />
        <DetailedRow label="Timestamp" value={dayjs(timestamp).format('DD MMM, YYYY HH:mm')} />
        <DetailedRow label="Execution Time" value={`${executionTimeMs}ms`} />
        <DetailedRow label="Deployment ID" value={log.deployment_id} />
        <DetailedRow label="Log ID" value={log.id} />
        <DetailedRow label="Request Path" value={requestUrl.pathname + requestUrl.search} />
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <h3 className="text-lg text-scale-1200 mb-4">Request body</h3>
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
        <h3 className="text-lg text-scale-1200 mb-4">
          Response{method ? ` ${method}` : null} body
        </h3>
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

export const FunctionInvocationHeaderRender = (log: any) => {
  const method = log?.method
  const path = log?.request?.url

  return `${method} ${path}`
}

export default FunctionInvocationSelectionRender
