import {
  ResponseCodeFormatter,
  RowLayout,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'
import DefaultPreviewColumnRenderer from './DefaultPreviewColumnRenderer'

export default [
  {
    formatter: (data: any) => {
      if (!data.row.status_code && !data.row.method) {
        return DefaultPreviewColumnRenderer[0].formatter(data)
      }
      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          <ResponseCodeFormatter row={data} value={data.row.status_code} />
          <TextFormatter value={data.row.method} />
          <TextFormatter value={data.row.id} />
        </RowLayout>
      )
    },
  },
]
