import { PreviewLogData } from '..'
import { TimestampLocalFormatter } from '../LogsFormatters'

const DefaultPreviewColumnRenderer = [
  {
    formatter: (data: { row: PreviewLogData }) => {
      return (
        <div className="flex w-full items-center gap-4 h-full">
          <TimestampLocalFormatter value={data.row.timestamp!} className="w-24" />
          <span className="font-mono text-xs truncate">{data.row.event_message}</span>
        </div>
      )
    },
  },
]
export default DefaultPreviewColumnRenderer
