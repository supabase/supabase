import { PreviewLogData } from '..'
import { TimestampLocalFormatter } from '../LogsFormatters'

const DefaultPreviewColumnRenderer = [
  {
    formatter: (data: { row: PreviewLogData }) => {
      return (
        <div className="flex w-full justify-start items-center gap-4 h-full">
          <TimestampLocalFormatter value={data.row.timestamp!} />
          <span className="font-mono text-xs truncate">{data.row.event_message}</span>
        </div>
      )
    },
  },
]
export default DefaultPreviewColumnRenderer
