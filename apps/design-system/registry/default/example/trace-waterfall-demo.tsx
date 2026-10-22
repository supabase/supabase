import { Trace, type Span, type TraceData } from 'ui-patterns/Trace'

function span(
  id: string,
  parentId: string | null,
  name: string,
  startMs: number,
  endMs: number | null,
  extra: Partial<Pick<Span, 'status' | 'events'>> = {}
): Span {
  return {
    id,
    parentId,
    traceId: 'demo',
    name,
    startMs,
    endMs,
    status: 'ok',
    attributes: {},
    events: [],
    ...extra,
  }
}

const finished: TraceData = {
  spans: [
    span('root', null, 'POST /checkout', 0, 480),
    span('auth', 'root', 'auth.verify', 8, 140, {
      events: [
        { timeMs: 30, name: 'jwt.decoded' },
        { timeMs: 95, name: 'cache.miss' },
      ],
    }),
    span('db', 'root', 'db.query', 70, 410),
    span('plan', 'db', 'db.plan', 72, 90),
    span('exec', 'db', 'db.execute', 95, 400),
    span('cache', 'root', 'cache.set', 420, 470, { status: 'error' }),
  ],
}

const live: TraceData = {
  nowMs: 1500,
  spans: [
    span('root', null, 'GET /export', 0, 1240),
    span('db', 'root', 'db.query', 100, 900),
    span('fetch', 'db', 'db.fetch', 120, 880),
    span('stream', 'root', 'stream.write', 1000, null),
  ],
}

export default function TraceWaterfallDemo() {
  return (
    <div className="flex w-full flex-col gap-8">
      <Trace.Root trace={finished} defaultCollapsed={new Set(['db'])}>
        <Trace.Waterfall treeWidth={220} className="h-56">
          <Trace.Ruler />
          <Trace.Grid />
          <Trace.Cursor />
          <Trace.Rows>
            <Trace.Cell />
            <Trace.Lane>
              <Trace.Bar />
              <Trace.CollapsedChildren />
              <Trace.Markers />
              <Trace.Slowest />
            </Trace.Lane>
          </Trace.Rows>
        </Trace.Waterfall>
      </Trace.Root>

      <Trace.Root trace={live} minRangeMs={3000}>
        <Trace.Waterfall treeWidth={220} className="h-40">
          <Trace.Ruler />
          <Trace.Grid />
          <Trace.Cursor />
          <Trace.Rows>
            <Trace.Cell />
            <Trace.Lane>
              <Trace.Bar />
              <Trace.CollapsedChildren />
              <Trace.Markers />
            </Trace.Lane>
          </Trace.Rows>
        </Trace.Waterfall>
      </Trace.Root>
    </div>
  )
}
