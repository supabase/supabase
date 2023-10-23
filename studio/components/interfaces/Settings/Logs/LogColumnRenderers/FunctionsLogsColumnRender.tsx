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
      if (!data.row.event_type && !data.row.level) {
        return DefaultPreviewColumnRenderer[0].formatter(data)
      }
      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          {data.row.event_type === 'uncaughtException' ? (
            <SeverityFormatter value={data.row.event_type} uppercase={false} />
          ) : (
            <SeverityFormatter value={data.row.level} />
          )}
          <TextFormatter className="w-full" value={data.row.event_message} />
        </RowLayout>
      )
    },
  },
]
