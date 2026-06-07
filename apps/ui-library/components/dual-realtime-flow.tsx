'use client'

import { BlockPreview } from './block-preview'

export function DualRealtimeFlow() {
  return (
    <>
      <div className="flex flex-row -space-x-px w-full">
        <BlockPreview name="realtime-flow-demo" isPair />
        <BlockPreview name="realtime-flow-demo" isPair />
      </div>
    </>
  )
}
