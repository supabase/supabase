import { isUnixMicro, PreviewLogData, unixMicroToIsoTimestamp } from '..'

const DefaultPreviewColumnRenderer = [
  {
    formatter: (data: { row: PreviewLogData }) => (
      <div className="flex w-full items-center gap-4 h-full">
        <span className="flex items-center text-xs pr-2">
          {isUnixMicro(data?.row?.timestamp)
            ? unixMicroToIsoTimestamp(data?.row?.timestamp)
            : data?.row?.timestamp}
        </span>
        <span className="font-mono text-xs truncate">{data.row.event_message}</span>
      </div>
    ),
  },
]
export default DefaultPreviewColumnRenderer
