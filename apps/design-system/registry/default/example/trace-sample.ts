import type { Span, SpanKind, SpanStatus } from 'ui-patterns/Trace'

export interface SampleTraceOptions {
  spanCount?: number
  seed?: number
  startMs?: number
  includeOrphan?: boolean
  includeRunning?: boolean
  includeZeroDuration?: boolean
  includeClockSkew?: boolean
}

export interface SampleTrace {
  traceId: string
  spans: Span[]
  nowMs: number
}

export const SAMPLE_TRACE_ID = 'trace-4f2a9c1e7b3d5a60'
export const SAMPLE_TRACE_START_MS = Date.UTC(2026, 0, 15, 9, 30, 0)

function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function span(
  id: string,
  parentId: string | null,
  name: string,
  serviceName: string,
  kind: SpanKind,
  startMs: number,
  endMs: number | null,
  status: SpanStatus,
  base: number,
  extra: Partial<Pick<Span, 'attributes' | 'events' | 'links'>> = {}
): Span {
  return {
    id,
    parentId,
    traceId: SAMPLE_TRACE_ID,
    name,
    serviceName,
    kind,
    startMs: base + startMs,
    endMs: endMs === null ? null : base + endMs,
    status,
    attributes: extra.attributes ?? {},
    events: (extra.events ?? []).map((event) => ({ ...event, timeMs: base + event.timeMs })),
    links: extra.links ?? [],
  }
}

function baseSpans(base: number, options: Required<SampleTraceOptions>): Span[] {
  const spans: Span[] = [
    span('span-0001', null, 'GET /api/orders', 'api-gateway', 'server', 0, 412, 'ok', base, {
      attributes: {
        'http.method': 'GET',
        'http.route': '/api/orders',
        'http.status_code': 200,
        'http.url': 'https://api.example.com/api/orders?limit=50',
        'user.id': 'usr_8f3k2',
        'net.peer.ip': '10.0.3.14',
        'request.id': 'req_01HZX4M2',
      },
      events: [
        { timeMs: 0.3, name: 'request.received' },
        { timeMs: 12, name: 'log', attributes: { 'log.severity': 'INFO', message: 'cache miss' } },
      ],
    }),
    span('span-0002', 'span-0001', 'authenticate', 'auth-service', 'client', 2, 38, 'ok', base, {
      attributes: { 'auth.method': 'jwt', 'auth.cached': false, 'auth.token_expiry': 1768556400 },
    }),
    span('span-0003', 'span-0002', 'jwt.verify', 'auth-service', 'internal', 4, 31, 'ok', base, {
      attributes: { 'jwt.alg': 'RS256', 'jwt.kid': 'k-2026-01' },
    }),
    span(
      'span-0004',
      'span-0001',
      'cache.get orders:usr_8f3k2',
      'redis-cache',
      'client',
      40,
      43,
      'ok',
      base,
      { attributes: { 'db.system': 'redis', 'cache.hit': false } }
    ),
    span('span-0005', 'span-0001', 'SELECT orders', 'postgres', 'client', 45, 210, 'ok', base, {
      attributes: {
        'db.system': 'postgresql',
        'db.name': 'app',
        'db.statement':
          'SELECT id, total, status FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        'db.rows': 50,
      },
    }),
    span('span-0006', 'span-0005', 'pg.connect', 'postgres', 'internal', 45, 52, 'ok', base, {
      attributes: { 'pool.waiting': 3, 'pool.size': 20 },
    }),
    span('span-0007', 'span-0005', 'pg.execute', 'postgres', 'internal', 52, 206, 'ok', base, {
      events: [{ timeMs: 180, name: 'first_row' }],
    }),
    span(
      'span-0008',
      'span-0001',
      'POST /payments/authorize',
      'payment-service',
      'client',
      215,
      398,
      'error',
      base,
      {
        attributes: {
          'http.method': 'POST',
          'http.status_code': 502,
          'error.message': 'upstream timeout after 150ms',
          'retry.count': 1,
          'payment.provider_response': {
            code: 'TIMEOUT',
            attempt: 2,
            details: { region: 'eu-west-1', latency_ms: 150 },
          },
        },
        events: [
          {
            timeMs: 395,
            name: 'exception',
            attributes: {
              'exception.type': 'UpstreamTimeoutError',
              'exception.message': 'upstream timeout after 150ms',
              'exception.stacktrace':
                'UpstreamTimeoutError: upstream timeout after 150ms\n    at charge (payments/provider.ts:88:11)\n    at authorize (payments/authorize.ts:42:5)',
            },
          },
        ],
        links: [{ traceId: 'trace-91cc0e4d2a7f1b38', spanId: 'span-77aa' }],
      }
    ),
    span(
      'span-0009',
      'span-0008',
      'authorize',
      'payment-service',
      'server',
      218,
      392,
      'error',
      base,
      {
        attributes: { 'payment.amount_cents': 12900, 'payment.currency': 'EUR' },
      }
    ),
    span('span-0010', 'span-0009', 'fraud.check', 'fraud-service', 'client', 220, 268, 'ok', base, {
      attributes: { 'fraud.model': 'v7', 'fraud.score': 0.12 },
      events: [{ timeMs: 265, name: 'score.computed', attributes: { 'fraud.score': 0.12 } }],
    }),
    span(
      'span-0011',
      'span-0009',
      'provider.charge',
      'payment-service',
      'client',
      270,
      390,
      'error',
      base,
      { attributes: { 'provider.name': 'cards-eu', 'provider.timeout_ms': 150 } }
    ),
    span(
      'span-0012',
      'span-0011',
      'http.request',
      'provider-client',
      'client',
      options.includeClockSkew ? 268 : 271,
      389,
      'error',
      base,
      {
        attributes: {
          'http.method': 'POST',
          'http.url': 'https://cards-eu.example.net/v1/charges',
        },
      }
    ),
    span(
      'span-0014',
      'span-0001',
      'render.response',
      'api-gateway',
      'internal',
      402,
      411,
      'ok',
      base,
      {
        attributes: { 'response.bytes': 18422, 'response.format': 'json' },
      }
    ),
  ]

  if (options.includeZeroDuration) {
    spans.push(
      span('span-0013', 'span-0001', 'cache.set', 'redis-cache', 'client', 400, 400, 'ok', base, {
        attributes: { 'db.system': 'redis', 'cache.ttl_seconds': 60 },
      })
    )
  }

  if (options.includeOrphan) {
    spans.push(
      span(
        'span-0015',
        'span-missing-parent',
        'background.job',
        'worker-service',
        'consumer',
        300,
        360,
        'ok',
        base,
        { attributes: { 'messaging.system': 'pgmq', 'messaging.destination': 'order_events' } }
      )
    )
  }

  if (options.includeRunning) {
    spans.push(
      span(
        'span-0016',
        'span-0001',
        'webhook.dispatch',
        'webhook-service',
        'producer',
        405,
        null,
        'unset',
        base,
        {
          attributes: { 'webhook.url': 'https://hooks.example.com/orders', 'webhook.attempt': 1 },
        }
      )
    )
  }

  return spans
}

const FILLER_NAMES = [
  'db.query',
  'cache.get',
  'http.request',
  'serialize',
  'validate',
  'deserialize',
  'queue.publish',
  'fn.invoke',
  'template.render',
  'policy.evaluate',
]

const FILLER_SERVICES = [
  'api-gateway',
  'auth-service',
  'postgres',
  'redis-cache',
  'payment-service',
  'fraud-service',
  'worker-service',
  'search-service',
]

export function createSampleTrace(options: SampleTraceOptions = {}): SampleTrace {
  const resolved: Required<SampleTraceOptions> = {
    spanCount: options.spanCount ?? 0,
    seed: options.seed ?? 42,
    startMs: options.startMs ?? SAMPLE_TRACE_START_MS,
    includeOrphan: options.includeOrphan ?? true,
    includeRunning: options.includeRunning ?? true,
    includeZeroDuration: options.includeZeroDuration ?? true,
    includeClockSkew: options.includeClockSkew ?? true,
  }

  const base = resolved.startMs
  const spans = baseSpans(base, resolved)
  const nowMs = base + 430

  if (resolved.spanCount > spans.length) {
    const random = mulberry32(resolved.seed)
    const depthOf = new Map<string, number>()
    const endOf = (candidate: Span) => candidate.endMs ?? nowMs
    for (const existing of spans) depthOf.set(existing.id, 0)

    const parentPool = spans.filter((candidate) => endOf(candidate) - candidate.startMs > 2)
    let counter = spans.length + 1

    while (spans.length < resolved.spanCount) {
      const parent = parentPool[Math.floor(random() * parentPool.length)]
      const parentDepth = depthOf.get(parent.id) ?? 0
      const parentStart = parent.startMs
      const parentDuration = Math.max(1, endOf(parent) - parentStart)
      const start = parentStart + random() * parentDuration * 0.85
      const maxDuration = Math.max(0.05, endOf(parent) - start)
      const duration = Math.max(0.05, random() * maxDuration * 0.6)
      const isError = random() < 0.03
      const id = `span-${counter.toString(16).padStart(6, '0')}`
      counter++

      const child: Span = {
        id,
        parentId: parent.id,
        traceId: SAMPLE_TRACE_ID,
        name: FILLER_NAMES[Math.floor(random() * FILLER_NAMES.length)],
        serviceName: FILLER_SERVICES[Math.floor(random() * FILLER_SERVICES.length)],
        kind: 'internal',
        startMs: start,
        endMs: start + duration,
        status: isError ? 'error' : 'ok',
        attributes: { 'generated.index': counter, 'generated.depth': parentDepth + 1 },
        events: isError
          ? [
              {
                timeMs: start + duration * 0.9,
                name: 'exception',
                attributes: { 'exception.type': 'Error' },
              },
            ]
          : [],
        links: [],
      }
      spans.push(child)
      depthOf.set(id, parentDepth + 1)
      if (parentDepth + 1 < 12 && duration > 2) parentPool.push(child)
    }
  }

  return { traceId: SAMPLE_TRACE_ID, spans, nowMs }
}
