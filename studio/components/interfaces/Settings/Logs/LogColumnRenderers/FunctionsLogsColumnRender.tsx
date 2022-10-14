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
        {data.row.event_type === 'uncaughtException' ? (
          <SeverityFormatter value={data.row.event_type} uppercase={false} />
        ) : (
          <SeverityFormatter value={data.row.level} />
        )}
        <TextFormatter className="w-full" value={data.row.event_message} />
      </RowLayout>
    ),
  },
]
