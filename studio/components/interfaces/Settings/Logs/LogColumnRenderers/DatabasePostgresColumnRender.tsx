import dayjs from 'dayjs'
import { SeverityFormatter } from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <div className="flex w-full items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-20 flex items-center gap-1">
            <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('DD MMM')}</span>
            <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}</span>
          </span>
          <div className="w-16 flex justify-center">
            <SeverityFormatter value={data?.row?.metadata[0].parsed[0].error_severity} />
          </div>
        </div>
        <div className="flex truncate">
          <span className="font-mono text-xs truncate">{data.row.event_message}</span>
        </div>
      </div>
    ),
  },
]
