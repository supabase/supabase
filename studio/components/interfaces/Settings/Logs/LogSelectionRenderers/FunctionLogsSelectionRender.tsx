import dayjs from 'dayjs'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight, SeverityFormatter } from '../LogsFormatters'

const FunctionLogsSelectionRender = ({ log }: any) => {
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
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
        <span className="text-scale-900 text-sm col-span-4">Event message</span>
        <div className="text-xs text-wrap font-mono text-scale-1200 mt-2 whitespace-pre-wrap overflow-x-auto">
          {log.event_message}
        </div>
      </div>
      <div className="h-px w-full bg-panel-border-interior-light dark:bg-panel-border-interior-dark"></div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <DetailedRow label="Severity" value={<SeverityFormatter value={log.metadata.level} />} />
        <DetailedRow label="Log ID" value={log.id} />
        <DetailedRow label="Deployment version" value={log?.metadata?.version} />
        <DetailedRow label="Timestamp" value={timestamp.format('DD MMM, YYYY HH:mm')} />
        <DetailedRow label="Execution ID" value={log.metadata.execution_id} />
        <DetailedRow label="Deployment ID" value={log.metadata.deployment_id} />
      </div>
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding}`}>
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
