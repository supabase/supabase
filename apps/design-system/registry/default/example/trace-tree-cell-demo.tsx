import { useState } from 'react'
import { Slider } from 'ui'
import { Trace } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

const sample = createSampleTrace()
const defaultCollapsed = new Set(['span-0008'])

export default function TraceTreeCellDemo() {
  const [indent, setIndent] = useState(14)

  return (
    <div className="flex w-full flex-col gap-4">
      <label className="flex items-center gap-2 text-xs text-foreground-light">
        Indent {indent}px
        <Slider
          className="min-w-40 flex-1"
          min={10}
          max={32}
          step={2}
          value={[indent]}
          onValueChange={([value]) => setIndent(value)}
        />
      </label>
      <Trace.Root trace={sample} defaultCollapsed={defaultCollapsed}>
        <Trace.Waterfall treeWidth={420} className="h-96 max-w-md">
          <Trace.Rows rowHeight={28}>
            <Trace.Cell indent={indent} className="border-r-0" />
          </Trace.Rows>
        </Trace.Waterfall>
      </Trace.Root>
    </div>
  )
}
