import { isUnixMicro, unixMicroToIsoTimestamp } from '..'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight } from '../LogsFormatters'

const DefaultPreviewSelectionRenderer = ({ log }: any) => {
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
        <span className="text-scale-900 text-sm col-span-4 whitespace-prep-wrap">{label}</span>
        <span
          className={`text-scale-1200 text-sm col-span-8 whitespace-prep-wrap ${
            code && 'text-xs font-mono'
          }`}
        >
          {value}
        </span>
      </div>
    )
  }

  return (
    <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
      <div className="flex flex-col gap-3">
        <h3 className="text-scale-900 text-sm">Event Message</h3>
        <div className="text-xs text-wrap font-mono text-scale-1200 whitespace-pre-wrap overflow-x-auto">
          {log.event_message}
        </div>
      </div>

      <DetailedRow
        label="ISO Timestamp"
        value={isUnixMicro(log.timestamp) ? unixMicroToIsoTimestamp(log.timestamp) : log.timestamp}
      />
      <div className="flex flex-col gap-3">
        <h3 className="text-scale-900 text-sm">Metadata</h3>
        <pre
          className=" className={`text-scale-1200 text-sm col-span-8 overflow-x-auto text-xs font-mono`}"
          dangerouslySetInnerHTML={{
            __html: jsonSyntaxHighlight(log.metadata),
          }}
        />
      </div>
    </div>
  )
}

export default DefaultPreviewSelectionRenderer
