import dayjs from 'dayjs'
import { jsonSyntaxHighlight, ResponseCodeFormatter, SeverityFormatter } from '../LogsFormatters'

const FunctionLogsSelectionRender = ({ log }: any) => {
  const request = log?.request
  const response = log?.response
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
      <div className="px-5">
        <span className="text-scale-900 text-sm col-span-4">Event message</span>

        <div
          className="text-xs text-wrap font-mono text-scale-1200 mt-2"
          dangerouslySetInnerHTML={{
            __html: log.event_message,
          }}
        />
      </div>
      <div className="h-px w-full bg-panel-border-interior-light dark:bg-panel-border-interior-dark"></div>
      <div className="px-5 space-y-2">
        <DetailedRow label="Severity" value={<SeverityFormatter value={log.metadata.level} />} />
        <DetailedRow label="Log ID" value={log.id} />
        <DetailedRow label="Deployment version" value={log?.metadata?.version} />
        <DetailedRow label="Timestamp" value={dayjs(log.timestamp).toISOString()} />
        <DetailedRow label="Execution ID" value={log.metadata.execution_id} />
        <DetailedRow label="Deployment ID" value={log.metadata.deployment_id} />
        <DetailedRow label="Function ID" value={log.metadata.function_id} />
      </div>
      <div className="px-5">
        <h3 className="text-lg text-scale-1200 mb-4">Metadata</h3>
        <pre className="text-sm syntax-highlight overflow-x-auto">
          <div
            className="text-wrap"
            dangerouslySetInnerHTML={{
              __html: log.metadata ? jsonSyntaxHighlight(log.metadata) : '',
            }}
          />
        </pre>
      </div>
    </>
  )
}

export default FunctionLogsSelectionRender
