import { SeverityFormatter, TimestampLocalFormatter } from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <div className="flex w-full items-center gap-2 h-full">
        <div className="flex items-center gap-2 h-full">
          <TimestampLocalFormatter className="w-24" value={data.row.timestamp!} />
          <div className="w-16 flex items-center">
            <SeverityFormatter value={data.row.error_severity} />
          </div>
        </div>
        <div className="flex truncate">
          <span className="font-mono text-xs truncate">{data.row.event_message}</span>
        </div>
      </div>
    ),
  },
]
