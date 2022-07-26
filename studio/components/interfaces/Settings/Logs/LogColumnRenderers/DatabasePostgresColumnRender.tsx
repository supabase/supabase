import dayjs from 'dayjs'
import { SeverityFormatter } from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <div className="flex w-full items-center gap-2 h-full">
        <div className="flex items-center gap-2 h-full">
          <span className="w-24 flex items-center gap-1">
            <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('DD MMM')}</span>
            <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}</span>
          </span>
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
