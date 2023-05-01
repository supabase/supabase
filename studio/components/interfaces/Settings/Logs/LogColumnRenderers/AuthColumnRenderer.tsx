import { PreviewLogData } from '..'
import {
  RowLayout,
  SeverityFormatter,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'

export default [
  {
    formatter: (data: {
      row: PreviewLogData & { level: string; msg: string; status: number; path: string }
    }) => {
      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          {data.row.level && <SeverityFormatter value={data.row.level} />}
          <TextFormatter
            className="w-full"
            value={`${data.row.path ? data.row.path + ' | ' : ''}${
              data.row.msg.trim() || data.row.event_message
            }`}
          />
        </RowLayout>
      )
    },
  },
]
