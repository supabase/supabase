import { ResponseCodeFormatter, TimestampLocalFormatter } from '../LogsFormatters'

export default [
  {
    formatter: (data: any) => (
      <div className="flex h-full w-full items-center justify-between gap-3">
        <TimestampLocalFormatter value={data.row.timestamp!} />
        <div className="flex h-full w-full items-center gap-4">
          <ResponseCodeFormatter row={data} value={data.row.status_code} />
          <span className="text-xs w-14">{data.row.request.method}</span>
          <span className="font-mono text-xs">{data.row.request.path}</span>
        </div>
      </div>
    ),
  },
]
