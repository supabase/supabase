import { PreviewLogData } from '..'
import { TimestampLocalFormatter } from '../LogsFormatters'

const DefaultPreviewColumnRenderer = [
  {
    formatter: (data: { row: PreviewLogData }) => {
      return (
        <div className="flex w-full items-center gap-4 h-full">
          <span className="w-24 flex items-center gap-1">
            <TimestampLocalFormatter value={data.row.timestamp!} />
          </span>

          <span className="font-mono text-xs truncate">{data.row.event_message}</span>
        </div>
      )
    },
  },
]
export default DefaultPreviewColumnRenderer
