import TraceViewerClient from './Trace/trace-viewer-client'

interface TraceDetailTabProps {
  id: string
}

export function TraceDetailTab({ id }: TraceDetailTabProps) {
  return (
    <div className="h-[calc(100vh-200px)] w-full bg-black">
      <TraceViewerClient />
    </div>
  )
}
