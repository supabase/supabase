import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import { Trace, type Span } from 'ui-patterns/Trace'

const DURATION_MS = 6000

interface Step {
  id: string
  parentId: string | null
  name: string
  startMs: number
  endMs: number
  status?: 'error'
  events?: { timeMs: number; name: string }[]
}

const PLAN: Step[] = [
  {
    id: 'run',
    parentId: null,
    name: 'POST /functions/v1/process-order',
    startMs: 0,
    endMs: DURATION_MS,
    events: [{ timeMs: 450, name: 'order.validated' }],
  },
  { id: 'auth', parentId: 'run', name: 'auth.verify_jwt', startMs: 50, endMs: 400 },
  { id: 'select', parentId: 'run', name: 'postgrest.select', startMs: 450, endMs: 1800 },
  { id: 'query', parentId: 'select', name: 'db.query', startMs: 500, endMs: 1700 },
  { id: 'upload', parentId: 'run', name: 'storage.upload', startMs: 1900, endMs: 3600 },
  {
    id: 'write',
    parentId: 'upload',
    name: 'storage.write',
    startMs: 1950,
    endMs: 3500,
    events: [{ timeMs: 2500, name: 'invoice.rendered' }],
  },
  { id: 'broadcast', parentId: 'run', name: 'realtime.broadcast', startMs: 3700, endMs: 5900 },
  {
    id: 'webhook',
    parentId: 'run',
    name: 'webhook.deliver',
    startMs: 3900,
    endMs: 5200,
    status: 'error',
    events: [
      { timeMs: 4300, name: 'retry 1' },
      { timeMs: 4800, name: 'retry 2' },
    ],
  },
]

function buildSpans(elapsedMs: number): Span[] {
  return PLAN.filter((step) => elapsedMs >= step.startMs).map((step) => {
    const isDone = elapsedMs >= step.endMs
    return {
      id: step.id,
      parentId: step.parentId,
      traceId: 'live-demo',
      name: step.name,
      startMs: step.startMs,
      endMs: isDone ? step.endMs : null,
      status: isDone ? (step.status ?? 'ok') : 'unset',
      attributes: {},
      events: (step.events ?? []).filter((event) => event.timeMs <= elapsedMs),
    }
  })
}

export default function TraceWaterfallLiveDemo() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const baseMs = useRef(0)
  const sessionStart = useRef(0)

  useEffect(() => {
    if (!isPlaying) return
    sessionStart.current = performance.now()
    const interval = setInterval(() => {
      const elapsed = baseMs.current + (performance.now() - sessionStart.current)
      if (elapsed >= DURATION_MS) {
        baseMs.current = DURATION_MS
        setElapsedMs(DURATION_MS)
        setIsPlaying(false)
        return
      }
      setElapsedMs(elapsed)
    }, 100)
    return () => {
      clearInterval(interval)
      baseMs.current = Math.min(
        DURATION_MS,
        baseMs.current + (performance.now() - sessionStart.current)
      )
      setElapsedMs(baseMs.current)
    }
  }, [isPlaying])

  const trace = { spans: buildSpans(elapsedMs), nowMs: elapsedMs }

  return (
    <div className="flex w-full flex-col gap-3">
      <Trace.Root trace={trace} minRangeMs={3000}>
        <Trace.Header>
          <Trace.Title />
          <Trace.Status />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="default"
              size="tiny"
              icon={isPlaying ? <Pause /> : <Play />}
              onClick={() => {
                if (!isPlaying && baseMs.current >= DURATION_MS) {
                  baseMs.current = 0
                  setElapsedMs(0)
                }
                setIsPlaying((playing) => !playing)
              }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </Trace.Header>
        <Trace.Waterfall treeWidth={330} className="h-80">
          <Trace.Minimap />
          <Trace.Ruler>
            <Trace.CollapseAll />
            <Trace.ResetZoom />
          </Trace.Ruler>
          <Trace.Grid />
          <Trace.Cursor />
          <Trace.Rows>
            <Trace.Cell />
            <Trace.Lane>
              <Trace.Bar />
              <Trace.Timing />
              <Trace.CollapsedChildren />
              <Trace.Markers />
            </Trace.Lane>
          </Trace.Rows>
        </Trace.Waterfall>
        <Trace.Inspector />
      </Trace.Root>
    </div>
  )
}
