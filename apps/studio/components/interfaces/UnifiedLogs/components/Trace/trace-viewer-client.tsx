import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import type { TraceData } from './types/trace'

// Use dynamic import with ssr: false to prevent server-side rendering issues
const TraceViewerComponent = dynamic(() => import('./trace-viewer'), { ssr: false })

interface TraceViewerClientProps {
  traceData?: TraceData
}

export default function TraceViewerClient({ traceData }: TraceViewerClientProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is only rendered on the client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center text-neutral-400">
        Loading trace viewer...
      </div>
    )
  }

  return <TraceViewerComponent traceData={traceData} />
}
