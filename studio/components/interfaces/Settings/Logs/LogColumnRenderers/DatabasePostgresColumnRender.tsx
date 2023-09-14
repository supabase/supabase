import {
  RowLayout,
  SeverityFormatter,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'
import DefaultPreviewColumnRenderer from './DefaultPreviewColumnRenderer'

export default [
  {
    formatter: (data: any) => {
      if (!data.row.error_severity) {
        return DefaultPreviewColumnRenderer[0].formatter(data)
      }
      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          <SeverityFormatter value={data.row.error_severity} />
          <TextFormatter className="w-full" value={data.row.event_message} />
        </RowLayout>
      )
    },
  },
]
