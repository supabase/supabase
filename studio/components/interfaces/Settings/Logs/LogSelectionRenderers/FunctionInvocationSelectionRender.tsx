import dayjs from 'dayjs'
import { jsonSyntaxHighlight, ResponseCodeFormatter } from '../LogsFormatters'

const FunctionInvocationSelectionRender = ({ log }: any) => {
  const functionId = log.metadata
  const request = log?.request
  const response = log?.response
  const method = log?.method
  const status = log?.status_code
  const requestUrl = request?.url
  const host = request?.host

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
        <span className="text-scale-900 text-sm col-span-4">{label}</span>
        <span className={`text-scale-1200 text-sm col-span-8 ${code && 'text-xs font-mono'}`}>
          {value}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="px-5 space-y-2">
        <DetailedRow label="Status" value={<ResponseCodeFormatter value={status} />} />
        <DetailedRow label="Method" value={method} />
        <DetailedRow label="Timestamp" value={dayjs(log.timestamp).toISOString()} />
        <DetailedRow label="Deployment ID" value={log.deployment_id} />
        <DetailedRow label="Function ID" value={log.function_id} />
        <DetailedRow label="Log ID" value={log.id} />
        <DetailedRow label="Request url" value={requestUrl} />
        <DetailedRow label="Host" value={host} />
      </div>
      <div className="px-5">
        <h3 className="text-lg text-scale-1200 mb-4">Request body</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: request ? jsonSyntaxHighlight(request) : '',
            }}
          />
        </pre>
      </div>
      <div className="px-5">
        <h3 className="text-lg text-scale-1200 mb-4">
          Response{method ? ` ${method}` : null} body
        </h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            dangerouslySetInnerHTML={{
              __html: response ? jsonSyntaxHighlight(response) : '',
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
