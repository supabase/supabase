import { PreviewLogData } from '..'
import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import { jsonSyntaxHighlight, SelectionDetailedTimestampRow } from '../LogsFormatters'

const DefaultPreviewSelectionRenderer = ({ log }: { log: PreviewLogData }) => (
  <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-6`}>
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground-lighter text-sm">Event Message</h3>
      <div className="text-xs text-wrap font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
        {log.event_message}
      </div>
    </div>
    <SelectionDetailedTimestampRow value={log.timestamp} />
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground-lighter text-sm">Metadata</h3>
      <pre
        className=" className={`text-foreground text-sm col-span-8 overflow-x-auto text-xs font-mono`}"
        dangerouslySetInnerHTML={{
          __html: jsonSyntaxHighlight(log.metadata || {}),
        }}
      />
    </div>
  </div>
)

export default DefaultPreviewSelectionRenderer
