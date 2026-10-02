import { Trace } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

const sample = createSampleTrace({ includeOrphan: false, includeRunning: false })

export default function TraceWaterfallCompactDemo() {
  return (
    <Trace.Root trace={sample}>
      <Trace.Waterfall treeWidth={200} className="h-56 w-full">
        <Trace.Ruler />
        <Trace.Rows rowHeight={22} readOnly>
          <Trace.Cell indent={10} />
          <Trace.Lane>
            <Trace.Bar />
          </Trace.Lane>
        </Trace.Rows>
      </Trace.Waterfall>
    </Trace.Root>
  )
}
