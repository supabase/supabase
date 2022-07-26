import dayjs from 'dayjs'
import { ResponseCodeFormatter } from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <div className="flex h-full w-full items-center justify-between gap-3">
        <div className="flex h-full w-full items-center gap-4">
          <ResponseCodeFormatter row={data} value={data.row.status_code} />
          <span className="text-xs w-14">{data.row.request.method}</span>
          <span className="font-mono text-xs">{data.row.request.path}</span>
        </div>
        <div>
          <span className="flex w-full h-full items-center gap-1">
            <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('DD MMM')}</span>
            <span className="text-xs">{dayjs(data?.row?.timestamp / 1000).format('HH:mm:ss')}</span>
          </span>
        </div>
      </div>
    ),
  },
]
