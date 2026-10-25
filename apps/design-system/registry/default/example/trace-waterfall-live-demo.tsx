import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from 'ui'
import type { Span } from 'ui-patterns/Trace'
import { Trace } from 'ui-patterns/Trace'

function buildSpans(elapsedMs: number): Span[] {
  const spans: Span[] = [
    {
      id: 'run',
      parentId: null,
      traceId: 'trace-live',
      name: 'agent.run',
      serviceName: 'orchestrator',
      kind: 'internal',
      startMs: 0,
      endMs: null,
      status: 'unset',
      attributes: { 'agent.task': 'Summarize open PRs' },
      events: [],
      links: [],
    },
    {
      id: 'plan',
      parentId: 'run',
      traceId: 'trace-live',
      name: 'llm.plan',
      serviceName: 'llm',
      kind: 'client',
      startMs: 50,
      endMs: Math.min(elapsedMs, 1400),
      status: elapsedMs >= 1400 ? 'ok' : 'unset',
      attributes: { model: 'opus-5' },
      events: [],
      links: [],
    },
  ]

  if (elapsedMs > 1400) {
    spans.push({
      id: 'search',
      parentId: 'run',
      traceId: 'trace-live',
      name: 'tool.search_prs',
      serviceName: 'tool',
      kind: 'client',
      startMs: 1450,
      endMs: elapsedMs >= 3200 ? 3200 : null,
      status: elapsedMs >= 3200 ? 'ok' : 'unset',
      attributes: { query: 'is:open is:pr' },
      events: [],
      links: [],
    })
  }

  return spans
}

export default function TraceWaterfallLiveDemo() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const baseElapsedRef = useRef(0)
  const sessionStartRef = useRef(0)

  useEffect(() => {
    if (!isPlaying) return
    sessionStartRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsedMs(baseElapsedRef.current + (Date.now() - sessionStartRef.current))
    }, 200)
    return () => {
      baseElapsedRef.current += Date.now() - sessionStartRef.current
      clearInterval(interval)
    }
  }, [isPlaying])

  const trace = { spans: buildSpans(elapsedMs), nowMs: elapsedMs }

  return (
    <div className="flex w-full flex-col gap-3">
      <Trace.Root trace={trace} minRangeMs={5000}>
        <Trace.Header>
          <Trace.Title>agent.run</Trace.Title>
          <Trace.Status />
          <Button
            variant="default"
            size="tiny"
            className="ml-auto"
            icon={isPlaying ? <Pause /> : <Play />}
            onClick={() => setIsPlaying((playing) => !playing)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </Trace.Header>
        <div className="flex flex-col overflow-hidden rounded-md border border-default">
          <Trace.Waterfall treeWidth={220} className="h-40 w-full">
            <Trace.Ruler />
            <Trace.Rows rowHeight={28} readOnly>
              <Trace.Cell />
              <Trace.Lane>
                <Trace.Bar />
              </Trace.Lane>
            </Trace.Rows>
          </Trace.Waterfall>
        </div>
      </Trace.Root>
    </div>
  )
}
