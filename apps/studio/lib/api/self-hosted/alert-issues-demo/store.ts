import { generateDemoEvents, queryDemoEvents, type DemoEvent } from './events'
import {
  ADVISOR_LINTS,
  DEMO_RULES,
  SCRIPTED_INVESTIGATION_REPORTS,
  type DemoAdvisorLint,
  type DemoRule,
} from './fixtures'
import { getDemoDelays } from './mode'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const CUSTOM_RULE_WINDOW = 5 * MINUTE
export const ASSISTANT_AUTHOR = 'Supabase Assistant'

export type DemoInvestigation = {
  status: 'pending' | 'completed' | 'failed' | 'timed_out'
  requested_at: string
  completed_at: string | null
  /** When a pending investigation's scripted report is posted. */
  completesAt?: number
}

export type DemoIssue = {
  alert_issue_id: string
  version: number
  status: 'open' | 'acknowledged' | 'snoozed' | 'resolved'
  change: string
  title: string
  description: string | null
  severity: string
  category: string
  rule_key: string
  identifiers: Record<string, string>
  metadata: Record<string, unknown>
  signal_count: number
  first_seen_at: string
  last_seen_at: string
  attention_at: string
  snoozed_until: string | null
  actor: string
  notebook: DemoRule['notebook']
  investigation: DemoInvestigation | null
}

export type DemoComment = {
  comment_id: string
  alert_issue_id: string
  author: string
  body: string
  created_at: string
}

export type DemoSilence = {
  id: string
  rule_key: string
  matchers: { project: string }
  comment: string | null
  created_by: string
  inserted_at: string
}

type ScheduledArrival = { arrivesAt: number; issue: DemoIssue }

export type DemoStore = {
  projectRef: string
  rules: (DemoRule & { firesAt?: number; hasFired?: boolean })[]
  issues: DemoIssue[]
  comments: DemoComment[]
  reads: Map<string, number>
  silences: DemoSilence[]
  events: DemoEvent[]
  arrivals: ScheduledArrival[]
  nextId: number
}

const iso = (ms: number) => new Date(ms).toISOString()

export function nextId(store: DemoStore, prefix: string) {
  store.nextId += 1
  return `${prefix}-${store.nextId}`
}

function issueFor(
  rule: DemoRule,
  projectRef: string,
  fields: Partial<DemoIssue> & Pick<DemoIssue, 'alert_issue_id' | 'title' | 'first_seen_at'>
): DemoIssue {
  return {
    version: Date.parse(fields.first_seen_at),
    status: 'open',
    change: 'opened',
    description: rule.description,
    severity: rule.severity,
    category: rule.category,
    rule_key: rule.rule_key,
    identifiers: { project: projectRef },
    metadata: {},
    signal_count: 1,
    last_seen_at: fields.first_seen_at,
    attention_at: fields.first_seen_at,
    snoozed_until: null,
    actor: 'system',
    notebook: rule.notebook,
    investigation: null,
    ...fields,
  }
}

const ruleFor = (key: string) => {
  const rule = DEMO_RULES.find((candidate) => candidate.rule_key === key)
  if (!rule) throw new Error(`Unknown demo rule ${key}`)
  return rule
}

function edgeIssue(
  projectRef: string,
  now: number,
  functionId: string,
  fields: Partial<DemoIssue>
) {
  return issueFor(ruleFor('supabase.edge-function-5xx'), projectRef, {
    alert_issue_id: `edge-5xx-${functionId}`,
    title: `Edge Function errors: ${functionId}`,
    first_seen_at: iso(now - 35 * MINUTE),
    last_seen_at: iso(now - MINUTE),
    identifiers: { project: projectRef, function_id: functionId },
    ...fields,
  })
}

function advisorIssue(projectRef: string, now: number, lint: DemoAdvisorLint) {
  const { schema, name, entity } = lint.metadata
  const target = name ?? entity ?? lint.name
  return issueFor(ruleFor(`supabase.advisor.${lint.name}`), projectRef, {
    alert_issue_id: `advisor-${lint.name}`,
    title: schema ? `${lint.title}: ${schema}.${target}` : lint.title,
    description: lint.detail,
    first_seen_at: iso(now - 3 * MINUTE),
    identifiers: {
      project: projectRef,
      entity: target,
      table: target,
      ...(schema && { schema }),
    },
    metadata: {
      detail: lint.detail,
      remediation: lint.remediation,
      lint_name: lint.name,
      row_count: 1,
      sample_rows: [{ title: lint.title, entity: target, ...(schema && { schema }) }],
    },
  })
}

function seed(projectRef: string, now: number): DemoStore {
  const { arrivalMs, investigationMs } = getDemoDelays()
  const store: DemoStore = {
    projectRef,
    rules: DEMO_RULES.map((rule) => ({ ...rule })),
    issues: [],
    comments: [],
    reads: new Map(),
    silences: [],
    events: generateDemoEvents(
      ADVISOR_LINTS.map((lint) => ({
        ageMs: MINUTE,
        event_message: lint.detail,
        body: { ...lint, metadata: { ...lint.metadata } },
      }))
    ),
    arrivals: [],
    nextId: 0,
  }

  const reportAt = now - 30 * MINUTE
  store.issues.push(
    edgeIssue(projectRef, now, 'stripe-webhook', {
      signal_count: 7,
      attention_at: iso(reportAt),
      metadata: { row_count: 1, sample_rows: [{ function_id: 'stripe-webhook', errors: 96 }] },
      investigation: {
        status: 'completed',
        requested_at: iso(now - 35 * MINUTE),
        completed_at: iso(reportAt),
      },
    }),
    edgeIssue(projectRef, now, 'send-email', {
      first_seen_at: iso(now - 2 * HOUR),
      signal_count: 24,
      metadata: { row_count: 1, sample_rows: [{ function_id: 'send-email', errors: 31 }] },
      investigation: { status: 'timed_out', requested_at: iso(now - 2 * HOUR), completed_at: null },
    }),
    edgeIssue(projectRef, now, 'resize-image', {
      status: 'acknowledged',
      change: 'acknowledged',
      actor: 'self-hosted',
      metadata: { row_count: 1, sample_rows: [{ function_id: 'resize-image', errors: 3 }] },
    }),
    edgeIssue(projectRef, now, 'image-proxy', {
      status: 'resolved',
      change: 'resolved',
      first_seen_at: iso(now - 50 * HOUR),
      last_seen_at: iso(now - 49 * HOUR),
      attention_at: iso(now - 50 * HOUR),
    }),
    issueFor(ruleFor('supabase.edge-function-latency'), projectRef, {
      alert_issue_id: 'edge-latency-stripe-webhook',
      title: 'Slow Edge Function responses: stripe-webhook',
      first_seen_at: iso(now - 20 * MINUTE),
      last_seen_at: iso(now - 2 * MINUTE),
      signal_count: 4,
      identifiers: { project: projectRef, function_id: 'stripe-webhook' },
      metadata: { row_count: 1, sample_rows: [{ function_id: 'stripe-webhook', slow: 41 }] },
    }),
    ...ADVISOR_LINTS.map((lint) => advisorIssue(projectRef, now, lint))
  )

  store.comments.push(
    {
      comment_id: 'comment-report-stripe',
      alert_issue_id: 'edge-5xx-stripe-webhook',
      author: ASSISTANT_AUTHOR,
      body: SCRIPTED_INVESTIGATION_REPORTS['supabase.edge-function-5xx'],
      created_at: iso(reportAt),
    },
    {
      comment_id: 'comment-user-stripe',
      alert_issue_id: 'edge-5xx-stripe-webhook',
      author: 'self-hosted',
      body: 'Stripe is timing out on our side; retrying with backoff in #482.',
      created_at: iso(now - 10 * MINUTE),
    }
  )

  const arrivesAt = now + arrivalMs
  store.arrivals.push({
    arrivesAt,
    issue: issueFor(ruleFor('supabase.postgres-connections'), projectRef, {
      alert_issue_id: 'postgres-connections',
      title: 'Database connections near the limit',
      first_seen_at: iso(arrivesAt),
      metadata: { row_count: 1, sample_rows: [{ connections: 54, max_connections: 60 }] },
      investigation: {
        status: 'pending',
        requested_at: iso(arrivesAt),
        completed_at: null,
        completesAt: arrivesAt + investigationMs,
      },
    }),
  })

  return store
}

function fireCustomRule(store: DemoStore, rule: DemoStore['rules'][number], now: number) {
  if (!rule.lql) return
  const result = queryDemoEvents(store.events, {
    lql: rule.lql,
    from: iso(now - CUSTOM_RULE_WINDOW),
    to: iso(now),
    now,
  })
  if ('error' in result || result.total === 0) return

  const groups = new Map<string, number>()
  result.events.forEach((event) => {
    const values = rule.group_by.map((path) => String(groupValue(event.body, path) ?? ''))
    const key = JSON.stringify(values)
    groups.set(key, (groups.get(key) ?? 0) + 1)
  })

  groups.forEach((count, key) => {
    const values: string[] = JSON.parse(key)
    const identifiers = Object.fromEntries(
      rule.group_by.map((path, i) => [path.split('.').pop() ?? path, values[i]])
    )
    store.issues.push(
      issueFor(rule, store.projectRef, {
        alert_issue_id: nextId(store, rule.rule_key),
        title: values.length > 0 ? `${rule.name}: ${values.join(', ')}` : rule.name,
        first_seen_at: iso(now),
        signal_count: 1,
        identifiers: { ...identifiers, project: store.projectRef },
        metadata: { row_count: count, count },
      })
    )
  })
}

function groupValue(body: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' ? Reflect.get(value, key) : undefined,
      body
    )
}

/** Applies everything due by `now`: arrivals, finished investigations and custom rule runs. */
export function tick(store: DemoStore, now: number) {
  store.arrivals
    .filter((arrival) => arrival.arrivesAt <= now)
    .forEach((arrival) => store.issues.push(arrival.issue))
  store.arrivals = store.arrivals.filter((arrival) => arrival.arrivesAt > now)

  store.issues.forEach((issue) => {
    const investigation = issue.investigation
    if (investigation?.status !== 'pending' || (investigation.completesAt ?? Infinity) > now) return

    const completedAt = iso(investigation.completesAt ?? now)
    issue.investigation = {
      status: 'completed',
      requested_at: investigation.requested_at,
      completed_at: completedAt,
    }
    issue.attention_at = completedAt
    issue.version += 1
    store.comments.push({
      comment_id: nextId(store, 'comment'),
      alert_issue_id: issue.alert_issue_id,
      author: ASSISTANT_AUTHOR,
      body:
        SCRIPTED_INVESTIGATION_REPORTS[issue.rule_key] ??
        '**Initial investigation**\n\nNothing unusual found.',
      created_at: completedAt,
    })
  })

  store.rules
    .filter((rule) => rule.firesAt !== undefined && rule.firesAt <= now && !rule.hasFired)
    .forEach((rule) => {
      rule.hasFired = true
      fireCustomRule(store, rule, now)
    })
}

const stores = new Map<string, DemoStore>()

/** The project's simulated Logflare state, seeded on first use and advanced to `now`. */
export function getDemoStore(projectRef: string, now = Date.now()) {
  const store = stores.get(projectRef) ?? seed(projectRef, now)
  stores.set(projectRef, store)
  tick(store, now)
  return store
}

export function getDemoStores() {
  return [...stores.values()]
}

export function resetDemoStores() {
  stores.clear()
}
