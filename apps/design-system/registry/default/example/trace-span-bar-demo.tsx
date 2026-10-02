import { useState } from 'react'
import { Slider } from 'ui'
import { Trace, useSpan, type Span, type TimeWindow } from 'ui-patterns/Trace'

import { createSampleTrace } from './trace-sample'

const sample = createSampleTrace()
const root = sample.spans[0]
const base = root.startMs
const TRACE_MS = sample.nowMs - base

function make(id: string, name: string, overrides: Partial<Span> = {}): Span {
  return { ...root, id, parentId: null, name, status: 'ok', events: [], ...overrides }
}

const spans: Span[] = [
  make('default', 'default'),
  make('selected', 'selected'),
  make('error', 'error status', { status: 'error' }),
  make('unset', 'unset status', { status: 'unset' }),
  make('running', 'running', { startMs: base + 300, endMs: null, status: 'unset' }),
  make('zero', 'zero duration', { startMs: base + 200, endMs: base + 200 }),
  make('markers', 'markers', {
    startMs: base + 20,
    endMs: base + 380,
    events: [
      { timeMs: base + 60, name: 'log', attributes: { 'log.severity': 'INFO' } },
      { timeMs: base + 200, name: 'cache.warmed' },
      { timeMs: base + 340, name: 'exception', attributes: { 'exception.type': 'TimeoutError' } },
    ],
  }),
]

const filteredSpans: Span[] = [
  make('dim', 'dim (ancestor of a match)'),
  make('match', 'match', { parentId: 'dim', startMs: base + 100, endMs: base + 250 }),
]

function Label() {
  const { span } = useSpan()
  return (
    <span className="w-44 shrink-0 self-center px-2 text-xs text-foreground-light">
      {span.name}
    </span>
  )
}

function Gallery() {
  return (
    <Trace.Waterfall className="h-auto">
      <Trace.Rows rowHeight={28} className="h-56" readOnly>
        <Label />
        <Trace.Lane>
          <Trace.Bar />
          <Trace.Markers />
        </Trace.Lane>
      </Trace.Rows>
    </Trace.Waterfall>
  )
}

export default function TraceSpanBarDemo() {
  const [range, setRange] = useState<[number, number]>([0, TRACE_MS])
  const isFull = range[0] === 0 && range[1] === TRACE_MS
  const window: TimeWindow | undefined = isFull ? undefined : [base + range[0], base + range[1]]

  return (
    <div className="flex w-full flex-col gap-4">
      <label className="flex items-center gap-2 text-xs text-foreground-light">
        Window (narrow it to clip bars)
        <Slider
          className="min-w-40 flex-1"
          min={0}
          max={TRACE_MS}
          step={5}
          minStepsBetweenThumbs={4}
          value={range}
          onValueChange={([start, end]) => setRange([start, end])}
        />
      </label>
      <Trace.Root trace={{ spans, nowMs: sample.nowMs }} window={window} selectedId="selected">
        <Gallery />
      </Trace.Root>
      <Trace.Root
        trace={{ spans: filteredSpans, nowMs: sample.nowMs }}
        window={window}
        defaultQuery="name:match"
      >
        <Trace.Waterfall className="h-auto">
          <Trace.Rows rowHeight={28} className="h-16" readOnly>
            <Label />
            <Trace.Lane>
              <Trace.Bar />
            </Trace.Lane>
          </Trace.Rows>
        </Trace.Waterfall>
      </Trace.Root>
    </div>
  )
}
