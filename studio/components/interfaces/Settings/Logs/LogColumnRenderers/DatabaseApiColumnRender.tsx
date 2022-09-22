import {
  ResponseCodeFormatter,
  RowLayout,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <RowLayout>
        <TimestampLocalFormatter value={data.row.timestamp!} />
        <ResponseCodeFormatter row={data} value={data.row.status_code} />
        <TextFormatter className="w-20" value={data.row.method} />
        <TextFormatter className="w-full" value={data.row.path} />
      </RowLayout>
    ),
  },
]
