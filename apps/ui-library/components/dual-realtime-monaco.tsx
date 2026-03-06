'use client'

import { BlockPreview } from './block-preview'

export function DualRealtimeMonaco() {
  return (
    <div className="flex flex-row -space-x-px w-full">
      <BlockPreview name="realtime-monaco-demo" isPair />
      <BlockPreview name="realtime-monaco-demo" isPair />
    </div>
  )
}
