'use client'

import { BlockPreview } from './block-preview'

export function DualRealtimeCursor() {
  return (
    <div className="flex flex-col lg:flex-row lg:-space-x-px w-full">
      <BlockPreview name="realtime-cursor-demo" isPair />
      <BlockPreview name="realtime-cursor-demo" isPair />
    </div>
  )
}
