import { PreviewLogData } from '..'
import { RowLayout, TextFormatter, TimestampLocalFormatter } from '../LogsFormatters'

export default [
  {
    formatter: (data: { row: PreviewLogData }) => (
      <RowLayout>
        <TimestampLocalFormatter value={data.row.timestamp!} />
        <TextFormatter className="w-full" value={data.row.event_message} />
      </RowLayout>
    ),
  },
]
