import { tryParseJson } from 'lib/helpers'
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
      const parsed: AuthEventParsed | undefined = tryParseJson(data.row.event_message.trim())

      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          {parsed?.level && <SeverityFormatter value={parsed?.level} />}
          <TextFormatter
            className="w-full"
            value={`${parsed?.path ? parsed?.path + ' | ' : ''}${
              parsed?.msg.trim() || data.row.event_message
            }`}
          />
        </RowLayout>
      )
    },
  },
]
