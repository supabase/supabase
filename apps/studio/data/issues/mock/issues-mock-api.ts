import dayjs from 'dayjs'
import * as z from 'zod'

import {
  issueNotificationRuleInputSchema,
  issueNotificationRuleSchema,
  type IssueNotificationRuleInput,
} from '../issue-notification-schema'
import {
  issueActorSchema,
  issueCheckRunSchema,
  issueEpisodeSchema,
  issueEventSchema,
  issueSchema,
  issueStatusSchema,
  type Issue,
  type IssueActor,
  type IssueAffectedResource,
  type IssueAffectedResourceUpdatePayload,
  type IssueAssistantActor,
  type IssueCategory,
  type IssueCheck,
  type IssueCheckRun,
  type IssueCheckRunScope,
  type IssueCheckRunTrigger,
  type IssueDocument,
  type IssueEpisode,
  type IssueEvent,
  type IssueListFilters,
  type IssueSeverity,
  type IssueStatus,
  type IssueUpdatePayload,
  type IssueUserActor,
} from '../issue-schema'
import { buildMockAssistantReply } from './issues-mock-assistant'
import { getIssueCheckDefinition, ISSUE_CHECK_DEFINITIONS } from './issues-mock-checks'
import {
  advancePassingResource,
  advancePendingFinding,
  applyIssueMutes,
  getHighestSeverity,
  hasBeenQuietFor,
  isActiveResource,
  isCheckStale,
  isPastReopenWindow,
  maxValue,
  pinIssueMutes,
  type PendingFinding,
} from './issues-mock-evaluation'
import {
  ASSISTANT,
  buildSeedDb,
  MOCK_ACTORS,
  MOCK_DB_VERSION,
  VIEWER_ID,
  VIEWER_PLACEHOLDER,
  type MockIssuesDb,
  type StoredIssue,
} from './issues-mock-fixtures'
import type { IssueAffectedResourceDraft, IssueDraft } from './lint-to-issue'
import { isoDateTimeString } from '@/lib/iso-datetime'
import { ResponseError } from '@/types'

// A stand-in for the Issues API until it exists. Each function matches an endpoint the
// backend will expose, so swapping these for `get`/`post` calls in the query hooks is the
// only change the UI needs:
//
//   GET    /v1/projects/{ref}/issues                               listIssues
//   POST   /v1/projects/{ref}/issues                               createIssue (upserts on fingerprint)
//   GET    /v1/projects/{ref}/issues/{id}                          getIssue
//   PATCH  /v1/projects/{ref}/issues/{id}                          updateIssue
//   PATCH  /v1/projects/{ref}/issues/{id}/affected/{affected_id}   updateAffectedResource
//   GET    /v1/projects/{ref}/issues/{id}/timeline                 listIssueTimeline
//   POST   /v1/projects/{ref}/issues/{id}/comments                 createIssueComment
//   GET    /v1/projects/{ref}/checks                               listIssueChecks
//   PATCH  /v1/projects/{ref}/checks/{id}                          updateIssueCheck
//   GET    /v1/projects/{ref}/checks/{id}/runs                     listIssueCheckRuns
//
// `reportCheckRun` is internal: it's what a scheduled run, an on-demand run or a run after a
// migration does with a check's findings, and shows how affected resources open, clear and
// regress.
// Starting an on-demand run (POST /checks/{id}/runs) needs the real check to evaluate, so
// the mock has no stand-in for it.
//
// State lives in memory and is mirrored to localStorage per project so changes survive a
// reload. State saved by an older version of the prototype is dropped and the project
// reseeds. An Assistant reply is stored with a timestamp a few seconds ahead and stays hidden
// until then, which is what the UI's "working" state and polling pick up.

export const MOCK_ASSISTANT_REPLY_DELAY_MS = 4000

const STORAGE_KEY_PREFIX = 'supabase-issues-mock'
const SEVERITY_RANK: Record<IssueSeverity, number> = { critical: 0, warning: 1, info: 2 }
const MENTION_PATTERN = /@assistant\b/i

const MAX_RUNS_PER_CHECK = 20

// Saved state from an older version of the prototype doesn't parse, so the project reseeds
const storedDbSchema = z.object({
  version: z.literal(MOCK_DB_VERSION),
  issues: z.array(issueSchema.omit({ comment_count: true, agents_working: true })),
  events: z.array(issueEventSchema),
  runs: z.array(issueCheckRunSchema),
  episodes: z.array(issueEpisodeSchema),
  pending: z.record(
    z.string(),
    z.record(
      z.string(),
      z.object({
        failing_since: z.string(),
        run_count: z.number().int(),
        peak_value: z.number().nullable(),
      })
    )
  ),
  scheduled: z.array(
    z.object({
      issue_id: z.string(),
      at: z.string(),
      status: issueStatusSchema,
      actor: issueActorSchema,
    })
  ),
  disabled_check_ids: z.array(z.string()),
  notification_rules: z.array(issueNotificationRuleSchema),
})

const dbs = new Map<string, MockIssuesDb>()

// The server knows who's calling from the auth token. The mock is told once the profile
// loads, and maps the seed's "viewer" placeholder onto that person when reading.
let viewer: IssueUserActor = VIEWER_PLACEHOLDER

export function setIssuesMockViewer(actor: IssueUserActor) {
  viewer = actor
}

const storageKey = (projectRef: string) => `${STORAGE_KEY_PREFIX}:${projectRef}`

function readStoredDb(projectRef: string): MockIssuesDb | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(projectRef))
    if (!raw) return undefined
    const parsed = storedDbSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

function persist(projectRef: string, db: MockIssuesDb) {
  try {
    window.localStorage.setItem(storageKey(projectRef), JSON.stringify(db))
  } catch {
    // Storage can be full or blocked; the in-memory copy still works for this session
  }
}

function getDb(projectRef: string) {
  let db = dbs.get(projectRef)
  if (!db) {
    db = readStoredDb(projectRef) ?? buildSeedDb(projectRef)
    dbs.set(projectRef, db)
    persist(projectRef, db)
  }
  // Snoozes first: an issue that wakes up lifts the mutes its snooze put on affected resources
  const hasEndedSnoozes = endExpiredSnoozes(db)
  const hasEndedMutes = endExpiredMutes(db)
  const hasAppliedScheduled = applyScheduledChanges(db)
  if (hasEndedSnoozes || hasEndedMutes || hasAppliedScheduled) persist(projectRef, db)
  return db
}

export function resetIssuesMock(projectRef: string) {
  const db = buildSeedDb(projectRef)
  dbs.set(projectRef, db)
  persist(projectRef, db)
}

const delay = () =>
  new Promise((resolve) => setTimeout(resolve, 180 + Math.round(Math.random() * 240)))

const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

const nowIso = () => new Date().toISOString()

export async function listIssueNotificationRules({ projectRef }: { projectRef: string }) {
  await delay()
  return getDb(projectRef).notification_rules.map((rule) => ({ ...rule }))
}

export async function saveIssueNotificationRule({
  projectRef,
  id,
  rule,
}: {
  projectRef: string
  id?: string
  rule: IssueNotificationRuleInput
}) {
  await delay()
  const parsed = issueNotificationRuleInputSchema.safeParse(rule)
  if (!parsed.success) throw new ResponseError(parsed.error.issues[0].message, 400)
  const db = getDb(projectRef)
  if (id && !db.notification_rules.some((item) => item.id === id)) {
    throw new ResponseError('Notification rule not found', 404)
  }
  const saved = { ...parsed.data, id: id ?? createId('notification') }
  if (id)
    db.notification_rules = db.notification_rules.map((item) => (item.id === id ? saved : item))
  else db.notification_rules.push(saved)
  persist(projectRef, db)
  return { ...saved }
}

export async function deleteIssueNotificationRule({
  projectRef,
  id,
}: {
  projectRef: string
  id: string
}) {
  await delay()
  const db = getDb(projectRef)
  db.notification_rules = db.notification_rules.filter((rule) => rule.id !== id)
  persist(projectRef, db)
}

export async function listIssueChecks({
  projectRef,
}: {
  projectRef: string
}): Promise<IssueCheck[]> {
  await delay()
  const db = getDb(projectRef)
  const now = nowIso()

  return ISSUE_CHECK_DEFINITIONS.map((check) => {
    const runs = db.runs.filter((run) => run.check_id === check.id)
    const lastCompleted = runs
      .filter(({ status }) => status === 'passed' || status === 'failed')
      .at(-1)
    return {
      ...check,
      is_enabled: !db.disabled_check_ids.includes(check.id),
      last_run: structuredClone(runs.at(-1) ?? null),
      is_stale: isCheckStale({
        intervalSeconds: check.interval_seconds,
        lastCompletedAt: lastCompleted?.finished_at ?? null,
        now,
      }),
    }
  })
}

/** Most recent first, up to the last 20 runs. */
export async function listIssueCheckRuns({
  projectRef,
  checkId,
}: {
  projectRef: string
  checkId: string
}): Promise<IssueCheckRun[]> {
  await delay()
  if (!getIssueCheckDefinition(checkId)) throw new ResponseError('Check not found', 404)
  return getDb(projectRef)
    .runs.filter((run) => run.check_id === checkId)
    .reverse()
    .map((run) => structuredClone(run))
}

export async function updateIssueCheck({
  projectRef,
  checkId,
  isEnabled,
}: {
  projectRef: string
  checkId: string
  isEnabled: boolean
}) {
  await delay()
  if (!getIssueCheckDefinition(checkId)) throw new ResponseError('Check not found', 404)
  const db = getDb(projectRef)
  db.disabled_check_ids = db.disabled_check_ids.filter((id) => id !== checkId)
  if (!isEnabled) db.disabled_check_ids.push(checkId)
  persist(projectRef, db)
  return { id: checkId, is_enabled: isEnabled }
}

const isVisible = (event: IssueEvent) => dayjs(event.created_at).valueOf() <= Date.now()

function findIssue(db: MockIssuesDb, id: string) {
  const issue = db.issues.find((item) => item.id === id)
  if (!issue) throw new ResponseError('Issue not found', 404)
  return issue
}

/** A fingerprint can span several issues once a check refiles; reports update the newest. */
function findLatestIssue(db: MockIssuesDb, fingerprint: string) {
  return db.issues
    .filter((item) => item.fingerprint === fingerprint)
    .reduce<
      StoredIssue | undefined
    >((latest, item) => (!latest || item.created_at > latest.created_at ? item : latest), undefined)
}

// Omit that keeps the event union discriminated
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
type NewIssueEvent = DistributiveOmit<IssueEvent, 'id' | 'issue_id' | 'created_at'>

function addEvent(
  db: MockIssuesDb,
  issue: StoredIssue,
  event: NewIssueEvent,
  createdAt = nowIso()
): IssueEvent {
  const created: IssueEvent = {
    ...event,
    id: createId('evt'),
    issue_id: issue.id,
    created_at: createdAt,
  }
  db.events.push(created)
  issue.updated_at = nowIso()
  return created
}

function setStatus(
  db: MockIssuesDb,
  issue: StoredIssue,
  status: IssueStatus,
  actor: IssueActor,
  { hasMetadataChanged = false, at = nowIso() }: { hasMetadataChanged?: boolean; at?: string } = {}
) {
  if (issue.status === status && !hasMetadataChanged) return
  const from = issue.status
  issue.status = status
  issue.resolved_at = status === 'resolved' ? at : null
  if (status !== 'dismissed') issue.dismiss_reason = null
  if (status !== 'snoozed') issue.snoozed_until = null
  issue.affected = applyIssueMutes({ affected: issue.affected, issue, actor, now: at })
  // Resolving says the problem is gone, so whatever is still open clears and its episode
  // ends. If the check finds it again, that's a new episode and a regression.
  if (status === 'resolved') {
    for (const affected of issue.affected) {
      if (affected.status !== 'open') continue
      affected.status = 'cleared'
      affected.failing_since = null
      affected.passing_since = null
      const episode = findOpenEpisode(db, affected.id)
      if (episode) episode.ended_at = at
    }
  }
  addEvent(
    db,
    issue,
    {
      type: 'status_changed',
      actor,
      from,
      to: status,
      dismiss_reason: issue.dismiss_reason,
      snoozed_until: issue.snoozed_until,
    },
    at
  )
}

/** Status changes an agent scheduled to land with its reply, e.g. resolving after a fix. */
function applyScheduledChanges(db: MockIssuesDb) {
  const due = db.scheduled.filter((change) => dayjs(change.at).valueOf() <= Date.now())
  if (due.length === 0) return false

  db.scheduled = db.scheduled.filter((change) => !due.includes(change))
  for (const change of due) {
    const issue = db.issues.find((item) => item.id === change.issue_id)
    if (issue) setStatus(db, issue, change.status, change.actor, { at: change.at })
  }
  return true
}

function endExpiredSnoozes(db: MockIssuesDb) {
  let hasChanged = false

  for (const issue of db.issues) {
    if (issue.status !== 'snoozed' || !issue.snoozed_until) continue
    if (dayjs(issue.snoozed_until).valueOf() > Date.now()) continue
    setStatus(db, issue, 'open', MOCK_ACTORS.advisor)
    hasChanged = true
  }

  return hasChanged
}

/** Affected resource mutes with a deadline lift on their own, like an expired silence. */
function endExpiredMutes(db: MockIssuesDb) {
  let hasChanged = false

  for (const issue of db.issues) {
    for (const affected of issue.affected) {
      const until = affected.muted?.source === 'resource' ? affected.muted.until : null
      if (!until || dayjs(until).valueOf() > Date.now()) continue
      affected.muted = null
      addEvent(db, issue, {
        type: 'resource_unmuted',
        actor: MOCK_ACTORS.advisor,
        affected_id: affected.id,
      })
      syncCheckSeverity(db, issue, MOCK_ACTORS.advisor)
      hasChanged = true
    }
  }

  return hasChanged
}

/**
 * A check's issue takes the highest severity among its unmuted open affected resources. Runs only
 * raise it, so a value hovering around a severity boundary doesn't flap; muting and
 * unmuting recompute it either way.
 */
function syncCheckSeverity(
  db: MockIssuesDb,
  issue: StoredIssue,
  actor: IssueActor,
  { canLower = true }: { canLower?: boolean } = {}
) {
  if (issue.origin.type !== 'check') return
  const highest = getHighestSeverity(
    issue.affected.filter(isActiveResource).map(({ severity }) => severity)
  )
  if (!highest || highest === issue.severity) return
  if (!canLower && getHighestSeverity([issue.severity, highest]) === issue.severity) return
  addEvent(db, issue, { type: 'severity_changed', actor, from: issue.severity, to: highest })
  issue.severity = highest
}

function resolveActor(actor: IssueActor): IssueActor {
  if (actor.type === 'user' && actor.id === VIEWER_ID) return { ...viewer, via: actor.via ?? null }
  if (actor.type === 'assistant' && actor.on_behalf_of?.id === VIEWER_ID) {
    return { ...actor, on_behalf_of: { id: viewer.id, name: viewer.name } }
  }
  return actor
}

function toIssue(db: MockIssuesDb, stored: StoredIssue): Issue {
  const events = db.events.filter((event) => event.issue_id === stored.id)
  const agentsWorking = events
    .filter((event) => !isVisible(event))
    .map((event) => event.actor)
    .filter((actor): actor is IssueAssistantActor => actor.type === 'assistant')

  return structuredClone({
    ...stored,
    body: { ...stored.body, as_of: getBodyAsOf(db, stored) },
    created_by: resolveActor(stored.created_by),
    affected: stored.affected.map((affected) =>
      affected.muted
        ? {
            ...affected,
            muted: { ...affected.muted, muted_by: resolveActor(affected.muted.muted_by) },
          }
        : affected
    ),
    comment_count: events.filter((event) => event.type === 'comment' && isVisible(event)).length,
    agents_working: agentsWorking.slice(0, 1),
  })
}

/**
 * When an issue body's relative log ranges count back from: live while anything is still
 * failing, otherwise when the last failing period ended, so the body keeps showing it.
 * An issue the check never recorded an episode for stays live.
 */
function getBodyAsOf(db: MockIssuesDb, issue: StoredIssue) {
  if (issue.affected.some(({ status }) => status === 'open')) return null
  const lastEnd = getLastEpisodeEnd(db, issue.id)
  return lastEnd ? isoDateTimeString(lastEnd) : null
}

function toEvent(event: IssueEvent): IssueEvent {
  const actor = resolveActor(event.actor)
  // A comment's relative log ranges count back from when it was posted
  if (event.type === 'comment') {
    const body = { ...event.body, as_of: isoDateTimeString(event.created_at) }
    return structuredClone({ ...event, actor, body })
  }
  return structuredClone({ ...event, actor })
}

const documentText = (document: IssueDocument) =>
  document.cells
    .map((cell) => (cell._tag === 'markdown_cell' ? cell.text : (cell.title ?? '')))
    .join(' ')

function matchesSearch(issue: StoredIssue, search: string) {
  const needle = search.trim().toLowerCase()
  if (!needle) return true

  return [
    issue.title,
    documentText(issue.body),
    ...issue.affected.map((affected) =>
      affected.resource ? `${affected.resource.schema ?? ''}.${affected.resource.name}` : ''
    ),
    issue.origin.type === 'check' ? issue.origin.check_name : '',
  ].some((value) => value.toLowerCase().includes(needle))
}

function matchesFilters(issue: StoredIssue, filters: IssueListFilters) {
  return (
    (!filters.severity?.length || filters.severity.includes(issue.severity)) &&
    (!filters.category?.length || filters.category.includes(issue.category)) &&
    (!filters.origin?.length || filters.origin.includes(issue.origin.type)) &&
    matchesSearch(issue, filters.search ?? '')
  )
}

function compareIssues(a: StoredIssue, b: StoredIssue) {
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  if (bySeverity !== 0) return bySeverity
  return b.last_seen_at.localeCompare(a.last_seen_at)
}

function newAffectedResource(
  draft: IssueAffectedResourceDraft,
  { severity, failingSince, now }: { severity: IssueSeverity; failingSince: string; now: string }
): IssueAffectedResource {
  return {
    id: createId('ins'),
    key: draft.key,
    resource: draft.resource,
    detail: draft.detail,
    severity: draft.severity ?? severity,
    value: draft.value ?? null,
    threshold: draft.threshold ?? null,
    unit: draft.unit ?? null,
    status: 'open',
    first_seen_at: failingSince,
    last_seen_at: now,
    last_evaluated_at: now,
    failing_since: failingSince,
    passing_since: null,
    muted: null,
  }
}

/** A failing run on an affected resource that's already open, or about to reopen. */
function refreshAffectedResource(
  affected: IssueAffectedResource,
  finding: IssueAffectedResourceDraft,
  now: string
) {
  affected.detail = finding.detail
  affected.severity = finding.severity ?? affected.severity
  affected.value = finding.value ?? null
  affected.threshold = finding.threshold ?? null
  affected.unit = finding.unit ?? null
  affected.last_seen_at = now
  affected.last_evaluated_at = now
  affected.passing_since = null
}

function startEpisode(
  db: MockIssuesDb,
  issueId: string,
  affectedId: string,
  { failing_since, run_count, peak_value }: PendingFinding
) {
  db.episodes.push({
    id: createId('epi'),
    issue_id: issueId,
    affected_id: affectedId,
    started_at: failing_since,
    ended_at: null,
    failing_run_count: run_count,
    peak_value,
  })
}

const findOpenEpisode = (db: MockIssuesDb, affectedId: string) =>
  db.episodes.find((episode) => episode.affected_id === affectedId && episode.ended_at === null)

/** When the issue's most recent episode ended, or null if it never had one. */
function getLastEpisodeEnd(db: MockIssuesDb, issueId: string) {
  const ends = db.episodes.flatMap(({ issue_id, ended_at }) =>
    issue_id === issueId && ended_at ? [ended_at] : []
  )
  return ends.sort().at(-1) ?? null
}

function recordRun(db: MockIssuesDb, run: IssueCheckRun) {
  db.runs.push(run)
  const runs = db.runs.filter((item) => item.check_id === run.check_id)
  if (runs.length <= MAX_RUNS_PER_CHECK) return
  const dropped = new Set(runs.slice(0, runs.length - MAX_RUNS_PER_CHECK).map(({ id }) => id))
  db.runs = db.runs.filter((item) => !dropped.has(item.id))
}

export type IssuesListResponse = {
  issues: Issue[]
  // Per-status totals with every other filter applied, for the status tabs
  counts: Record<IssueStatus, number>
}

export async function listIssues({
  projectRef,
  filters,
}: {
  projectRef: string
  filters: IssueListFilters
}): Promise<IssuesListResponse> {
  await delay()
  const db = getDb(projectRef)
  const matching = db.issues.filter((issue) => matchesFilters(issue, filters))

  const counts: Record<IssueStatus, number> = { open: 0, snoozed: 0, resolved: 0, dismissed: 0 }
  matching.forEach((issue) => (counts[issue.status] += 1))

  const issues = matching
    .filter((issue) => !filters.status?.length || filters.status.includes(issue.status))
    .sort(compareIssues)
    .map((issue) => toIssue(db, issue))

  return { issues, counts }
}

export async function getIssue({ projectRef, id }: { projectRef: string; id: string }) {
  await delay()
  const db = getDb(projectRef)
  return toIssue(db, findIssue(db, id))
}

export type IssueTimeline = {
  // What people, agents and the check did to the issue
  events: IssueEvent[]
  // What the check saw, one per failing stretch of an affected resource
  episodes: IssueEpisode[]
}

/** Everything the activity shows, read together so events and episodes never disagree. */
export async function listIssueTimeline({
  projectRef,
  id,
}: {
  projectRef: string
  id: string
}): Promise<IssueTimeline> {
  await delay()
  const db = getDb(projectRef)
  const issue = findIssue(db, id)

  return {
    events: db.events
      .filter((event) => event.issue_id === issue.id && isVisible(event))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(toEvent),
    episodes: db.episodes
      .filter((episode) => episode.issue_id === issue.id)
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
      .map((episode) => structuredClone(episode)),
  }
}

export type IssueCreatePayload = {
  title: string
  body: IssueDocument
  severity: IssueSeverity
  category: IssueCategory
  affected?: IssueAffectedResourceDraft[]
  // Callers that may report the same thing twice (agents running scheduled checks) pass a
  // fingerprint so a repeat updates the existing issue rather than filing a duplicate.
  fingerprint?: string
}

export async function createIssue({
  projectRef,
  payload,
}: {
  projectRef: string
  payload: IssueCreatePayload
}): Promise<Issue> {
  await delay()
  const db = getDb(projectRef)
  const now = nowIso()

  const existing = payload.fingerprint ? findLatestIssue(db, payload.fingerprint) : undefined

  if (existing) {
    existing.occurrence_count += 1
    existing.last_seen_at = now
    if (existing.status === 'resolved') setStatus(db, existing, 'open', VIEWER_PLACEHOLDER)
    persist(projectRef, db)
    return toIssue(db, existing)
  }

  const id = createId('iss')
  const issue: StoredIssue = {
    id,
    title: payload.title,
    body: payload.body,
    status: 'open',
    severity: payload.severity,
    category: payload.category,
    origin: { type: 'manual' },
    fingerprint: payload.fingerprint ?? `manual:${id}`,
    previous_issue_id: null,
    affected: (payload.affected ?? []).map((affected) =>
      newAffectedResource(affected, { severity: payload.severity, failingSince: now, now })
    ),
    created_by: VIEWER_PLACEHOLDER,
    occurrence_count: 1,
    first_seen_at: now,
    last_seen_at: now,
    created_at: now,
    updated_at: now,
    resolved_at: null,
    snoozed_until: null,
    dismiss_reason: null,
  }

  db.issues.push(issue)
  issue.affected.forEach((affected, index) =>
    startEpisode(db, issue.id, affected.id, {
      failing_since: now,
      run_count: 1,
      peak_value: payload.affected?.[index].value ?? null,
    })
  )
  addEvent(db, issue, { type: 'created', actor: VIEWER_PLACEHOLDER })
  persist(projectRef, db)
  return toIssue(db, issue)
}

export type CheckRunReport = {
  projectRef: string
  // The issue the check files; its origin names the check
  issue: IssueDraft
  trigger?: IssueCheckRunTrigger
  // Who started the run. Changes to the issue are still the check's own doing.
  actor?: IssueActor
  scope?: IssueCheckRunScope
  window?: { start: string; end: string } | null
} & (
  | { findings: IssueAffectedResourceDraft[]; error?: undefined }
  | { error: string; findings?: undefined }
)

export type CheckRunResult = { run: IssueCheckRun; issue: Issue | undefined }

/**
 * What a check run does with its findings. The check's issue is matched on fingerprint.
 * A finding opens an affected resource once it has failed for the check's `fire_after_seconds`;
 * an open affected resource the run no longer sees clears once it has passed for
 * `resolve_after_seconds`, which ends its episode. Only completed runs change anything,
 * and a scoped run only clears within its scope.
 *
 * Runs write episodes, not events: the only events a run adds are changes to the issue
 * itself. With automatic resolution the issue resolves once nothing has failed for
 * `resolve_issue_after_seconds`; with manual resolution it waits for a person. A new
 * unmuted affected resource reopens a resolved issue as a regression, and reopens a dismissed or
 * snoozed one because that only covered the affected resources open at the time. Once a
 * resolved issue is older than the check's `reopen_window_seconds`, a new failure files a
 * new issue linked to it instead.
 */
export async function reportCheckRun(report: CheckRunReport): Promise<CheckRunResult> {
  await delay()
  const {
    projectRef,
    issue: draft,
    trigger = 'schedule',
    actor = MOCK_ACTORS.advisor,
    scope = { type: 'full' },
    window = null,
  } = report
  const check =
    draft.origin.type === 'check' ? getIssueCheckDefinition(draft.origin.check_id) : undefined
  if (!check) throw new ResponseError('Check not found', 404)

  const db = getDb(projectRef)
  const now = nowIso()
  const advisor = MOCK_ACTORS.advisor
  const latest = findLatestIssue(db, draft.fingerprint)
  // Past the reopen window the check starts a new issue, and links back to this one
  const previous =
    latest &&
    isPastReopenWindow({
      issue: latest,
      now,
      reopenWindowSeconds: check.reopen_window_seconds,
    })
      ? latest
      : undefined
  const existing = previous ? undefined : latest
  const run: IssueCheckRun = {
    id: createId('run'),
    check_id: check.id,
    trigger,
    actor,
    scope,
    status: 'running',
    error: null,
    window,
    finding_count: 0,
    started_at: now,
    finished_at: now,
  }
  const finish = (issue: StoredIssue | undefined): CheckRunResult => {
    recordRun(db, run)
    persist(projectRef, db)
    return { run: structuredClone(run), issue: issue && toIssue(db, issue) }
  }

  if (db.disabled_check_ids.includes(check.id)) {
    run.status = 'skipped'
    return finish(latest)
  }
  // A run that couldn't evaluate says nothing about what's fixed
  if (report.error !== undefined) {
    run.status = 'error'
    run.error = report.error
    return finish(latest)
  }

  const isInScope = (key: string) => scope.type === 'full' || scope.keys.includes(key)
  const findings = report.findings.filter((finding) => isInScope(finding.key))
  const findingKeys = new Set(findings.map(({ key }) => key))
  run.status = findings.length > 0 ? 'failed' : 'passed'
  run.finding_count = findings.length

  const pending = (db.pending[check.id] ??= {})
  const hadActiveResources = existing?.affected.some(isActiveResource) ?? false
  const opening: Array<{ finding: IssueAffectedResourceDraft; stretch: PendingFinding }> = []
  let isSeen = false

  for (const finding of findings) {
    const affected = existing?.affected.find(({ key }) => key === finding.key)
    if (affected?.status === 'open') {
      refreshAffectedResource(affected, finding, now)
      const episode = findOpenEpisode(db, affected.id)
      if (episode) {
        episode.failing_run_count += 1
        episode.peak_value = maxValue(episode.peak_value, finding.value ?? null)
      }
      isSeen = true
      continue
    }
    const step = advancePendingFinding({
      pending: pending[finding.key],
      value: finding.value ?? null,
      now,
      fireAfterSeconds: check.fire_after_seconds,
    })
    if (step.shouldOpen) {
      delete pending[finding.key]
      opening.push({ finding, stretch: step.pending })
    } else {
      pending[finding.key] = step.pending
    }
  }
  // A pending finding this run didn't see again was a blip
  for (const key of Object.keys(pending)) {
    if (isInScope(key) && !findingKeys.has(key)) delete pending[key]
  }
  // Failing runs it took to open, counted once however many affected resources opened together
  const openingRunCount = Math.max(1, ...opening.map(({ stretch }) => stretch.run_count))

  if (!existing) {
    if (opening.length === 0) return finish(undefined)
    const affected = opening.map(({ finding, stretch }) =>
      newAffectedResource(finding, {
        severity: draft.severity,
        failingSince: stretch.failing_since,
        now,
      })
    )
    const created: StoredIssue = {
      ...draft,
      id: createId('iss'),
      status: 'open',
      severity: getHighestSeverity(affected.map(({ severity }) => severity)) ?? draft.severity,
      previous_issue_id: previous?.id ?? null,
      affected,
      created_by: advisor,
      occurrence_count: openingRunCount,
      first_seen_at: affected.map(({ first_seen_at }) => first_seen_at).sort()[0],
      last_seen_at: now,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      snoozed_until: null,
      dismiss_reason: null,
    }
    db.issues.push(created)
    affected.forEach((item, index) => startEpisode(db, created.id, item.id, opening[index].stretch))
    addEvent(db, created, { type: 'created', actor: advisor })
    if (previous)
      addEvent(db, previous, { type: 'recurred', actor: advisor, next_issue_id: created.id })
    return finish(created)
  }

  existing.updated_at = now

  for (const { finding, stretch } of opening) {
    const cleared = existing.affected.find(({ key }) => key === finding.key)
    if (cleared) {
      refreshAffectedResource(cleared, finding, now)
      cleared.status = 'open'
      cleared.failing_since = stretch.failing_since
      startEpisode(db, existing.id, cleared.id, stretch)
    } else {
      const added = newAffectedResource(finding, {
        severity: draft.severity,
        failingSince: stretch.failing_since,
        now,
      })
      existing.affected.push(added)
      startEpisode(db, existing.id, added.id, stretch)
    }
    isSeen = true
  }

  for (const affected of existing.affected) {
    if (affected.status !== 'open' || findingKeys.has(affected.key) || !isInScope(affected.key)) {
      continue
    }
    affected.last_evaluated_at = now
    const step = advancePassingResource({
      passingSince: affected.passing_since,
      now,
      resolveAfterSeconds: check.resolve_after_seconds,
    })
    if (!step.shouldClear) {
      affected.passing_since = step.passingSince
      continue
    }
    affected.status = 'cleared'
    affected.failing_since = null
    affected.passing_since = null
    const episode = findOpenEpisode(db, affected.id)
    if (episode) episode.ended_at = step.passingSince
  }

  const hasActiveResources = existing.affected.some(isActiveResource)
  const hasOpenResources = existing.affected.some(({ status }) => status === 'open')
  if (isSeen) existing.last_seen_at = now

  // A system reopen from `resolved` is how the timeline shows a regression
  if (hasActiveResources && existing.status === 'resolved') {
    setStatus(db, existing, 'open', advisor)
  } else if (hasActiveResources && existing.status !== 'open') {
    // Dismissing or snoozing covered the affected resources open at the time, and they stay muted
    existing.affected = pinIssueMutes(existing.affected)
    setStatus(db, existing, 'open', advisor)
  }
  if (hasActiveResources) syncCheckSeverity(db, existing, advisor, { canLower: false })
  if (isSeen && hasActiveResources) {
    existing.occurrence_count += hadActiveResources ? 1 : openingRunCount
  }

  const canResolve =
    !hasOpenResources &&
    check.resolution === 'automatic' &&
    (existing.status === 'open' || existing.status === 'snoozed')
  if (
    canResolve &&
    hasBeenQuietFor({
      lastFailingAt: getLastEpisodeEnd(db, existing.id),
      now,
      seconds: check.resolve_issue_after_seconds,
    })
  ) {
    setStatus(db, existing, 'resolved', advisor)
  }

  return finish(existing)
}

export async function updateIssue({
  projectRef,
  id,
  payload,
}: {
  projectRef: string
  id: string
  payload: IssueUpdatePayload
}): Promise<Issue> {
  await delay()
  const db = getDb(projectRef)
  const issue = findIssue(db, id)

  if (payload.status) {
    const hasMetadataChanged =
      (payload.status === 'dismissed' &&
        issue.dismiss_reason !== (payload.dismiss_reason ?? null)) ||
      (payload.status === 'snoozed' && issue.snoozed_until !== (payload.snoozed_until ?? null))
    // Set the reason and snooze end first so the status event records them
    if (payload.status === 'dismissed') issue.dismiss_reason = payload.dismiss_reason ?? null
    if (payload.status === 'snoozed') issue.snoozed_until = payload.snoozed_until ?? null
    setStatus(db, issue, payload.status, VIEWER_PLACEHOLDER, { hasMetadataChanged })
  }

  persist(projectRef, db)
  return toIssue(db, issue)
}

/** Mute one affected resource, e.g. a table that's public on purpose, or unmute it with `null`. */
export async function updateAffectedResource({
  projectRef,
  id,
  affectedId,
  payload,
}: {
  projectRef: string
  id: string
  affectedId: string
  payload: IssueAffectedResourceUpdatePayload
}): Promise<Issue> {
  await delay()
  const db = getDb(projectRef)
  const issue = findIssue(db, id)
  const affected = issue.affected.find((item) => item.id === affectedId)
  if (!affected) throw new ResponseError('Affected resource not found', 404)

  if (payload.muted) {
    const { reason, until } = payload.muted
    if (until && dayjs(until).valueOf() <= Date.now()) {
      throw new ResponseError('Choose a time in the future', 400)
    }
    affected.muted = {
      source: 'resource',
      reason,
      until,
      muted_by: VIEWER_PLACEHOLDER,
      muted_at: nowIso(),
    }
    addEvent(db, issue, {
      type: 'resource_muted',
      actor: VIEWER_PLACEHOLDER,
      affected_id: affected.id,
      reason,
      until,
    })
  } else if (affected.muted) {
    affected.muted = null
    addEvent(db, issue, {
      type: 'resource_unmuted',
      actor: VIEWER_PLACEHOLDER,
      affected_id: affected.id,
    })
  }
  syncCheckSeverity(db, issue, VIEWER_PLACEHOLDER)

  persist(projectRef, db)
  return toIssue(db, issue)
}

export async function createIssueComment({
  projectRef,
  id,
  body,
}: {
  projectRef: string
  id: string
  body: IssueDocument
}): Promise<IssueEvent> {
  await delay()
  const db = getDb(projectRef)
  const issue = findIssue(db, id)
  const comment = addEvent(db, issue, { type: 'comment', actor: VIEWER_PLACEHOLDER, body })

  // Mentioning the Assistant asks it to pick the issue up; its reply lands a little later,
  // and if it fixed the problem, it resolves the issue at the same moment
  const request = documentText(body)
  if (MENTION_PATTERN.test(request)) {
    const replyAt = new Date(Date.now() + MOCK_ASSISTANT_REPLY_DELAY_MS).toISOString()
    const openResource = issue.affected.find((affected) => affected.status === 'open')
    const reply = buildMockAssistantReply({
      checkId: issue.origin.type === 'check' ? issue.origin.check_id : undefined,
      resource: openResource?.resource ?? null,
      capturedAt: replyAt,
      request,
    })
    const actor = { ...ASSISTANT, on_behalf_of: { id: VIEWER_ID, name: VIEWER_PLACEHOLDER.name } }
    addEvent(db, issue, { type: 'comment', actor, body: reply.body }, replyAt)
    if (reply.resolves && issue.status !== 'resolved') {
      db.scheduled.push({ issue_id: issue.id, at: replyAt, status: 'resolved', actor })
    }
  }

  persist(projectRef, db)
  return toEvent(comment)
}
