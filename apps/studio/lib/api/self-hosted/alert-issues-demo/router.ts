import z from 'zod/v4'

import { queryDemoEvents } from './events'
import { fillLqlTemplate, parseLql } from './lql'
import { getDemoDelays } from './mode'
import { getDemoStore, getDemoStores, nextId, type DemoIssue, type DemoStore } from './store'

export type DemoRequest = {
  method: 'GET' | 'POST' | 'DELETE'
  searchParams?: Record<string, string>
  body?: unknown
}

export type DemoResponse = { status: number; body: unknown }

const ok = (body: unknown, status = 200): DemoResponse => ({ status, body })
const fail = (status: number, error: string): DemoResponse => ({ status, body: { error } })
const iso = (ms: number) => new Date(ms).toISOString()

const filtersSchema = z.object({ 'identifiers.project': z.string() })
const actionSchema = z.object({
  action: z.enum(['acknowledge', 'snooze', 'resolve', 'reopen']),
  actor: z.string().default('api'),
  until: z.string().optional(),
  filters: filtersSchema,
})
const readsSchema = z.object({
  alert_issue_ids: z.array(z.string()),
  read: z.boolean(),
  filters: filtersSchema,
})
const commentSchema = z.object({ author: z.string(), body: z.string() })
const previewSchema = z.object({
  lql: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
})
const issueTypeSchema = z.object({
  name: z.string().min(1),
  lql: z.string(),
  severity: z.enum(['critical', 'major', 'warning', 'info']),
  category: z.enum(['security', 'performance', 'health']),
  description: z.string().optional(),
  group_by: z.array(z.string()).default([]),
  identifiers: z.object({ project: z.string() }),
})
const silenceSchema = z.object({
  rule_key: z.string(),
  matchers: z.object({ project: z.string() }),
  created_by: z.string().default('api'),
})

const isSilenced = (store: DemoStore, ruleKey: string) =>
  store.silences.some((silence) => silence.rule_key === ruleKey)

const isVisible = (store: DemoStore, issue: DemoIssue) =>
  !isSilenced(store, issue.rule_key) && issue.investigation?.status !== 'pending'

function present(store: DemoStore, issue: DemoIssue) {
  const readAt = store.reads.get(issue.alert_issue_id)
  const { investigation, ...rest } = issue
  return {
    ...rest,
    investigation: investigation && {
      status: investigation.status,
      completed_at: investigation.completed_at,
    },
    silenced: isSilenced(store, issue.rule_key),
    unread: readAt === undefined || readAt < Date.parse(issue.attention_at),
  }
}

const findIssue = (store: DemoStore, id: string) =>
  store.issues.find((issue) => issue.alert_issue_id === id && isVisible(store, issue))

const ACTION_FROM: Record<z.infer<typeof actionSchema>['action'], DemoIssue['status'][]> = {
  acknowledge: ['open'],
  snooze: ['open', 'acknowledged'],
  resolve: ['open', 'acknowledged', 'snoozed'],
  reopen: ['resolved', 'snoozed'],
}
const ACTION_TO = {
  acknowledge: 'acknowledged',
  snooze: 'snoozed',
  resolve: 'resolved',
  reopen: 'open',
} as const
const ACTION_CHANGE = {
  acknowledge: 'acknowledged',
  snooze: 'snoozed',
  resolve: 'resolved',
  reopen: 'reopened',
} as const

function applyAction(
  store: DemoStore,
  issue: DemoIssue,
  input: z.infer<typeof actionSchema>,
  now: number
) {
  if (!ACTION_FROM[input.action].includes(issue.status)) {
    return fail(409, `Cannot ${input.action} an alert issue that is ${issue.status}`)
  }
  issue.status = ACTION_TO[input.action]
  issue.change = ACTION_CHANGE[input.action]
  issue.actor = input.actor
  issue.version = Math.max(issue.version + 1, now * 1000)
  issue.snoozed_until = input.action === 'snooze' ? (input.until ?? iso(now + 60 * 60_000)) : null
  if (input.action === 'reopen') issue.attention_at = iso(now)
  const { unread: _unread, ...snapshot } = present(store, issue)
  return ok(snapshot)
}

function issueTypes(store: DemoStore) {
  return store.rules.map((rule) => {
    const silence = store.silences.find((candidate) => candidate.rule_key === rule.rule_key)
    return {
      rule_key: rule.rule_key,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
      managed: rule.managed,
      language: rule.language,
      lql: rule.lql,
      group_by: rule.group_by,
      silenced: Boolean(silence),
      silence_id: silence?.id ?? null,
    }
  })
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function createIssueType(store: DemoStore, input: z.infer<typeof issueTypeSchema>, now: number) {
  const { source } = parseLql(input.lql)
  if (!source) return fail(422, 'The LQL must name its source with f:<source>')
  if (!store.events.some((event) => event.source === source))
    return fail(422, `Unknown source ${source}`)

  const base = `custom.${slug(input.name)}`
  const taken = (key: string) => store.rules.some((rule) => rule.rule_key === key)
  let ruleKey = base
  for (let n = 2; taken(ruleKey); n++) ruleKey = `${base}-${n}`

  const placeholders = input.group_by.map((path) => {
    const key = path.split('.').pop() ?? path
    return `${path.startsWith('metadata.') ? `m.${path.slice(9)}` : path}:{{${key}}}`
  })
  store.rules.push({
    rule_key: ruleKey,
    name: input.name,
    description: input.description ?? '',
    category: input.category,
    severity: input.severity,
    managed: false,
    language: 'lql',
    lql: input.lql,
    group_by: input.group_by,
    previewLql: [input.lql, ...placeholders].join(' '),
    notebook: [],
    investigate: false,
    firesAt: now + getDemoDelays().customRuleMs,
  })
  return ok(
    issueTypes(store).find((type) => type.rule_key === ruleKey),
    201
  )
}

const parse = <T>(schema: z.ZodType<T>, body: unknown) => schema.safeParse(body ?? {})

function routeIssue(store: DemoStore, id: string, rest: string, request: DemoRequest, now: number) {
  const issue = findIssue(store, id)
  if (!issue) return fail(404, 'Alert issue not found')

  if (rest === 'actions' && request.method === 'POST') {
    const input = parse(actionSchema, request.body)
    return input.success
      ? applyAction(store, issue, input.data, now)
      : fail(422, input.error.message)
  }
  if (rest === 'comments' && request.method === 'GET') {
    return ok(store.comments.filter((comment) => comment.alert_issue_id === id))
  }
  if (rest === 'comments' && request.method === 'POST') {
    const input = parse(commentSchema, request.body)
    if (!input.success) return fail(422, input.error.message)
    const body = input.data.body.trim()
    if (body.length === 0 || body.length > 5000)
      return fail(422, 'Comments must be 1 to 5000 characters')
    const comment = {
      comment_id: nextId(store, 'comment'),
      alert_issue_id: id,
      author: input.data.author,
      body,
      created_at: iso(now),
    }
    store.comments.push(comment)
    return ok(comment, 201)
  }
  if (rest === 'events' && request.method === 'GET') {
    const template = store.rules.find((rule) => rule.rule_key === issue.rule_key)?.previewLql
    if (!template) return fail(422, 'This alert issue type has no log preview')
    const filled = fillLqlTemplate(template, issue.identifiers)
    if ('error' in filled) return fail(422, filled.error)
    const result = queryDemoEvents(store.events, {
      lql: filled.lql,
      from: request.searchParams?.from,
      to: request.searchParams?.to,
      now,
    })
    return 'error' in result ? fail(422, result.error) : ok(result)
  }
  return fail(404, 'Not found')
}

function projectFrom(request: DemoRequest): string | undefined {
  const fromParams = request.searchParams?.['filters[identifiers.project]']
  if (fromParams) return fromParams
  const body = z
    .object({
      filters: filtersSchema.optional(),
      identifiers: z.object({ project: z.string() }).optional(),
      matchers: z.object({ project: z.string() }).optional(),
    })
    .safeParse(request.body ?? {})
  if (!body.success) return undefined
  return (
    body.data.filters?.['identifiers.project'] ??
    body.data.identifiers?.project ??
    body.data.matchers?.project
  )
}

function routeDelete(segments: string[]) {
  const [collection, id] = segments
  for (const store of getDemoStores()) {
    if (collection === 'issue_types') {
      const rule = store.rules.find((candidate) => candidate.rule_key === id)
      if (!rule) continue
      if (rule.managed)
        return fail(422, 'Managed alert issue types can only be changed with Terraform')
      store.rules = store.rules.filter((candidate) => candidate !== rule)
      return ok(null, 204)
    }
    if (collection === 'silences' && store.silences.some((silence) => silence.id === id)) {
      store.silences = store.silences.filter((silence) => silence.id !== id)
      return ok(null, 204)
    }
  }
  return fail(404, 'Not found')
}

/**
 * Answers a Logflare API request (path relative to `/api/`) from the in-memory simulation,
 * with the same status codes and JSON shapes as Logflare.
 */
export function simulateLogflareRequest(
  path: string,
  request: DemoRequest,
  now = Date.now()
): DemoResponse {
  const segments = path
    .replace(/^alerts\//, '')
    .split('/')
    .map(decodeURIComponent)
  if (request.method === 'DELETE') return routeDelete(segments)

  const projectRef = projectFrom(request) ?? 'default'
  const store = getDemoStore(projectRef, now)
  const [collection, id, rest] = segments

  if (collection === 'issues' && !id && request.method === 'GET') {
    const statuses = request.searchParams?.status?.split(',')
    return ok(
      store.issues
        .filter(
          (issue) => isVisible(store, issue) && (!statuses || statuses.includes(issue.status))
        )
        .sort((a, b) => Date.parse(b.last_seen_at) - Date.parse(a.last_seen_at))
        .map((issue) => present(store, issue))
    )
  }
  if (collection === 'issues' && id === 'reads' && request.method === 'POST') {
    const input = parse(readsSchema, request.body)
    if (!input.success) return fail(422, input.error.message)
    input.data.alert_issue_ids.forEach((issueId) =>
      input.data.read ? store.reads.set(issueId, now) : store.reads.delete(issueId)
    )
    return ok({ count: input.data.alert_issue_ids.length })
  }
  if (collection === 'issues' && id && rest) return routeIssue(store, id, rest, request, now)
  if (collection === 'preview' && request.method === 'POST') {
    const input = parse(previewSchema, request.body)
    if (!input.success) return fail(422, input.error.message)
    const result = queryDemoEvents(store.events, { ...input.data, now })
    return 'error' in result ? fail(422, result.error) : ok(result)
  }
  if (collection === 'issue_types' && request.method === 'GET') return ok(issueTypes(store))
  if (collection === 'issue_types' && request.method === 'POST') {
    const input = parse(issueTypeSchema, request.body)
    return input.success ? createIssueType(store, input.data, now) : fail(422, input.error.message)
  }
  if (collection === 'silences' && request.method === 'POST') {
    const input = parse(silenceSchema, request.body)
    if (!input.success) return fail(422, input.error.message)
    const silence = {
      id: String(store.silences.length + 1 + store.nextId),
      rule_key: input.data.rule_key,
      matchers: input.data.matchers,
      comment: null,
      created_by: input.data.created_by,
      inserted_at: iso(now),
    }
    store.nextId += 1
    store.silences.push(silence)
    return ok(silence, 201)
  }
  return fail(404, 'Not found')
}
