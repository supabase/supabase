import {
  RowLayout,
  SeverityFormatter,
  TextFormatter,
  TimestampLocalFormatter,
} from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <RowLayout>
        <TimestampLocalFormatter value={data.row.timestamp!} />
        <SeverityFormatter value={data.row.error_severity} />
        <TextFormatter className="w-full" value={data.row.event_message} />
      </RowLayout>
    ),
  },
]
