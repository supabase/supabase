import { Trace, type Span, type TraceData } from 'ui-patterns/Trace'

function span(
  id: string,
  parentId: string | null,
  name: string,
  startMs: number,
  endMs: number | null,
  extra: Partial<Pick<Span, 'status' | 'attributes' | 'events'>> = {}
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
    span('root', null, 'GET /rest/v1/orders', 0, 480),
    span('auth', 'root', 'auth.verify_jwt', 8, 140, {
      attributes: { 'enduser.id': 'usr_42', 'auth.method': 'jwt' },
      events: [
        { timeMs: 30, name: 'jwt.decoded' },
        { timeMs: 95, name: 'jwks.cache_miss' },
      ],
    }),
    span('db', 'root', 'postgrest.query', 70, 410),
    span('plan', 'db', 'db.plan', 72, 90),
    span('exec', 'db', 'db.execute', 95, 400),
    span('rls', 'root', 'rls.policy_check', 420, 470, { status: 'error' }),
  ],
}

export default function TraceWaterfallDemo() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Trace.Root trace={finished} defaultCollapsed={new Set(['db'])}>
        <Trace.Header>
          <Trace.Title />
          <Trace.Status />
        </Trace.Header>
        <Trace.Waterfall treeWidth={220} className="h-64">
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
              <Trace.Slowest />
            </Trace.Lane>
          </Trace.Rows>
        </Trace.Waterfall>
        <Trace.Inspector />
      </Trace.Root>
    </div>
  )
}
