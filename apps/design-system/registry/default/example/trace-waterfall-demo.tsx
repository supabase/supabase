import { useMemo, useState } from 'react'
import { Toggle } from 'ui'
import { Trace } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

export default function TraceWaterfallDemo() {
  const [isLarge, setIsLarge] = useState(false)
  const sample = useMemo(() => createSampleTrace({ spanCount: isLarge ? 100_000 : 0 }), [isLarge])
  const [selectedId, setSelectedId] = useState<string | null>('span-0008')

  return (
    <div className="flex w-full flex-col gap-3">
      <Trace.Root trace={sample} selectedId={selectedId} onSelectedIdChange={setSelectedId}>
        <Trace.Header>
          <Trace.Title />
          <Trace.Status />
          <Trace.Filter placeholder="Filter spans, e.g. status:error" />
          <Trace.CollapseAll />
          <Trace.ResetZoom />
          <Toggle
            variant="outline"
            size="sm"
            className="ml-auto"
            pressed={isLarge}
            onPressedChange={setIsLarge}
          >
            100k spans
          </Toggle>
        </Trace.Header>
        <Trace.Minimap />
        <div className="flex h-[480px] overflow-hidden rounded-md border border-default">
          <Trace.Waterfall treeWidth={320} className="min-w-0 flex-1 rounded-none border-0">
            <Trace.Ruler />
            <Trace.Rows rowHeight={28}>
              <Trace.Cell />
              <Trace.Lane>
                <Trace.Bar />
                <Trace.Markers />
              </Trace.Lane>
            </Trace.Rows>
          </Trace.Waterfall>
          <Trace.Inspector className="w-[340px] shrink-0" />
        </div>
      </Trace.Root>
    </div>
  )
}
