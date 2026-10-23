import { useState } from 'react'
import { Slider } from 'ui'
import { Trace, type Span, type TimeWindow } from 'ui-patterns/Trace'

function traceOf(durationMs: number): { spans: Span[] } {
  return {
    spans: [
      {
        id: 'root',
        parentId: null,
        traceId: 'ruler',
        name: 'root',
        serviceName: 'svc',
        kind: 'server',
        startMs: 0,
        endMs: durationMs,
        status: 'ok',
        attributes: {},
        events: [],
        links: [],
      },
    ],
  }
}

const trace = traceOf(1000)

export default function TraceRulerDemo() {
  const [window, setWindow] = useState<TimeWindow>([0, 1000])

  return (
    <div className="flex w-full flex-col gap-6">
      <label className="flex flex-col gap-2 text-xs text-foreground-light">
        Window
        <Slider
          min={0}
          max={1000}
          step={1}
          minStepsBetweenThumbs={10}
          value={[window[0], window[1]]}
          onValueChange={([start, end]) => setWindow([start, end])}
        />
      </label>

      <Trace.Root trace={trace} window={window} onWindowChange={setWindow}>
        <Trace.Waterfall treeWidth={80}>
          <Trace.Ruler />
        </Trace.Waterfall>
      </Trace.Root>
    </div>
  )
}
