import { PreviewLogData } from '..'
import {
  RowLayout,
  SeverityFormatter,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'
import DefaultPreviewColumnRenderer from './DefaultPreviewColumnRenderer'

export default [
  {
    formatter: (data: {
      row: PreviewLogData & { level: string; msg: string | null; status: number; path: string }
    }) => {
      if (!data.row.level) {
        return DefaultPreviewColumnRenderer[0].formatter(data)
      }

      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          {data.row.level && <SeverityFormatter value={data.row.level} />}
          <TextFormatter
            className="w-full"
            value={`${data.row.path ? data.row.path + ' | ' : ''}${
              // not all log events have metadata.msg
              data.row.msg?.trim() || data.row.event_message
            }`}
          />
        </RowLayout>
      )
    },
  },
]
