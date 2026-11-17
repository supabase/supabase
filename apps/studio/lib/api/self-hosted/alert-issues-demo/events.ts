import { matchesLql, parseLql } from './lql'

/**
 * Seeded log events for the demo. Each event stores its age, not a timestamp, so the data
 * stays fresh however long the dev server runs: a query materialises `now - ageMs`.
 */
export type DemoEvent = {
  id: string
  source: string
  ageMs: number
  event_message: string
  body: { metadata: Record<string, string | number> } & Record<string, unknown>
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MAX_RANGE = 7 * DAY
const MAX_EVENTS = 100

/** Deterministic PRNG (mulberry32), so every server start seeds the same data. */
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const EDGE_FUNCTIONS = [
  { id: 'stripe-webhook', errorRate: 0.3, statuses: [500, 502, 504] },
  { id: 'send-email', errorRate: 0.12, statuses: [503] },
  { id: 'resize-image', errorRate: 0.01, statuses: [500] },
  { id: 'hello', errorRate: 0, statuses: [500] },
]

const FUNCTION_LOGS = [
  {
    id: 'stripe-webhook',
    level: 'error',
    message: 'Error: Stripe API request timed out after 10000ms',
  },
  {
    id: 'send-email',
    level: 'error',
    message: 'Error: SMTP connection refused (smtp.sendgrid.net:587)',
  },
  { id: 'stripe-webhook', level: 'info', message: 'Processed event checkout.session.completed' },
  { id: 'hello', level: 'log', message: 'Hello from Functions!' },
]

function edgeEvents(random: () => number): DemoEvent[] {
  const events: DemoEvent[] = []
  for (let age = 0; age < MAX_RANGE; age += age < 6 * HOUR ? 2 * MINUTE : 10 * MINUTE) {
    const isSpike = age < 30 * MINUTE
    EDGE_FUNCTIONS.forEach((fn) => {
      const requests = isSpike ? 3 : 1
      const errorRate = fn.id === 'stripe-webhook' && isSpike ? 0.9 : fn.errorRate
      for (let i = 0; i < requests; i++) {
        const isError = random() < errorRate
        const status = isError ? fn.statuses[Math.floor(random() * fn.statuses.length)] : 200
        const ms = isError ? 900 + Math.floor(random() * 9100) : 40 + Math.floor(random() * 360)
        events.push({
          id: `function_edge_logs-${events.length}`,
          source: 'function_edge_logs',
          ageMs: age + Math.floor(random() * 2 * MINUTE),
          event_message: `POST | ${status} | https://default.supabase.co/functions/v1/${fn.id}`,
          body: {
            metadata: {
              function_id: fn.id,
              status_code: status,
              method: 'POST',
              execution_time_ms: ms,
              region: 'us-east-1',
            },
          },
        })
      }
    })
  }
  return events
}

function functionLogEvents(random: () => number): DemoEvent[] {
  return Array.from({ length: 60 }, (_, i) => {
    const log = FUNCTION_LOGS[Math.floor(random() * FUNCTION_LOGS.length)]
    return {
      id: `function_logs-${i}`,
      source: 'function_logs',
      ageMs: i < 25 ? Math.floor(random() * 4 * MINUTE) : Math.floor(random() * 3 * HOUR),
      event_message: log.message,
      body: { metadata: { function_id: log.id, level: log.level, event_type: 'Log' } },
    }
  })
}

function authEvents(random: () => number): DemoEvent[] {
  return Array.from({ length: 30 }, (_, i) => {
    const isLimited = random() < 0.4
    return {
      id: `auth_logs-${i}`,
      source: 'auth_logs',
      ageMs: Math.floor(random() * 2 * HOUR),
      event_message: isLimited ? '429: Request rate limit reached' : 'Login',
      body: {
        metadata: {
          path: '/token',
          status: isLimited ? 429 : 200,
          level: isLimited ? 'warning' : 'info',
        },
      },
    }
  })
}

export function generateDemoEvents(advisorEvents: Omit<DemoEvent, 'id' | 'source'>[] = []) {
  const random = createRandom(7)
  return [
    ...edgeEvents(random),
    ...functionLogEvents(random),
    ...authEvents(random),
    ...advisorEvents.map((event, i) => ({
      ...event,
      id: `advisor_lints-${i}`,
      source: 'advisor_lints',
    })),
  ]
}

export type DemoEventsResult = {
  lql: string
  source: string
  from: string
  to: string
  total: number
  buckets: { timestamp: string; count: number }[]
  events: { id: string; timestamp: string; event_message: string; body: DemoEvent['body'] }[]
}

/** Runs an LQL filter over the events, shaped like Logflare's events and preview responses. */
export function queryDemoEvents(
  events: DemoEvent[],
  { lql, from, to, now }: { lql: string; from?: string; to?: string; now: number }
): DemoEventsResult | { error: string } {
  const { source, filters } = parseLql(lql)
  if (!source) return { error: 'Name a source with f:<source>' }
  if (!events.some((event) => event.source === source)) return { error: `Unknown source ${source}` }

  const end = to ? Date.parse(to) : now
  const start = Math.max(from ? Date.parse(from) : end - DAY, end - MAX_RANGE)
  const interval = end - start <= 3 * HOUR ? MINUTE : HOUR

  const matching = events
    .map((event) => ({ ...event, at: now - event.ageMs }))
    .filter((event) => event.source === source && event.at >= start && event.at <= end)
    .filter((event) => matchesLql(event, filters))
    .sort((a, b) => b.at - a.at)

  const counts = new Map<number, number>()
  matching.forEach(({ at }) => {
    const bucket = Math.floor(at / interval) * interval
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  })

  return {
    lql,
    source,
    from: new Date(start).toISOString(),
    to: new Date(end).toISOString(),
    total: matching.length,
    buckets: [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([bucket, count]) => ({ timestamp: new Date(bucket).toISOString(), count })),
    events: matching.slice(0, MAX_EVENTS).map(({ id, at, event_message, body }) => ({
      id,
      timestamp: new Date(at).toISOString(),
      event_message,
      body,
    })),
  }
}
