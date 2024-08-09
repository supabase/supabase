import { LOGS_TAILWIND_CLASSES } from '../Logs.constants'
import LogsDivider from '../Logs.Divider'
import { SelectionDetailedRow, SelectionDetailedTimestampRow } from '../LogsFormatters'

const PgUpgradeSelectionRenderer = ({ log }: any) => {
  const log_file = log?.metadata[0]?.log_file

  return (
    <>
      <div className={LOGS_TAILWIND_CLASSES.log_selection_x_padding}>
        <span className="col-span-4 text-sm text-foreground-lighter">Event message</span>

        <div className="text-wrap mt-2 overflow-x-auto whitespace-pre-wrap font-mono  text-xs text-foreground">
          {log.event_message}
        </div>
      </div>
      <LogsDivider />
      <div className={`${LOGS_TAILWIND_CLASSES.log_selection_x_padding} space-y-2`}>
        <SelectionDetailedTimestampRow value={log.timestamp} />
        <SelectionDetailedRow label="Log source" value={log_file} />
      </div>
    </>
  )
}

export default PgUpgradeSelectionRenderer
