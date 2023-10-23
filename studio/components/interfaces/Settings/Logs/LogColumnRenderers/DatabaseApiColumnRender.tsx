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
      if (!data.row.status_code && !data.row.method && !data.row.path) {
        return DefaultPreviewColumnRenderer[0].formatter(data)
      }
      return (
        <RowLayout>
          <TimestampLocalFormatter value={data.row.timestamp!} />
          <ResponseCodeFormatter row={data} value={data.row.status_code} />
          <TextFormatter className="w-20" value={data.row.method} />
          <TextFormatter className="w-full" value={data.row.path} />
        </RowLayout>
      )
    },
  },
]
