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
        <TextFormatter value={data.row.method} />
        <TextFormatter value={data.row.id} />
      </RowLayout>
    ),
  },
]
