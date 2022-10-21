import { PreviewLogData } from '..'
import { AuthEventParsed } from '../LogSelectionRenderers/AuthSelectionRenderer'
import {
  RowLayout,
  SeverityFormatter,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'

export default [
  {
    formatter: (data: { row: PreviewLogData }) => {
      let parsed: AuthEventParsed | undefined
      try {
        parsed = JSON.parse(data.row.event_message.trim())
      } catch (_e) {
        // do nothing
      }

      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          {parsed?.level && <SeverityFormatter value={parsed?.level} />}
          <TextFormatter className="w-full" value={`${parsed?.path? parsed?.path + " | ": ""}${parsed?.msg.trim() || data.row.event_message}`} />
        </RowLayout>
      )
    },
  },
]
