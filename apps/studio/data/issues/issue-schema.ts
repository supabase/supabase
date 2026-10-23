import * as z from 'zod'

import { agentCellSchema, notebookAsOfSchema } from '@/data/content/notebooks/notebook-schema'

// The Issues contract. Studio is the first consumer, but the same shapes back the
// Management API, the Assistant's issue tools, MCP and the CLI, so every field here has
// to make sense to an agent reading raw JSON as well as to the UI.

export const issueStatusSchema = z.enum(['open', 'snoozed', 'resolved', 'dismissed'])
export const issueSeveritySchema = z.enum(['critical', 'warning', 'info'])
export const issueCategorySchema = z.enum(['security', 'performance', 'health', 'usage', 'data'])
export const issueDismissReasonSchema = z.enum(['accepted_risk', 'false_positive', 'not_relevant'])

export type IssueStatus = z.infer<typeof issueStatusSchema>
export type IssueSeverity = z.infer<typeof issueSeveritySchema>
export type IssueCategory = z.infer<typeof issueCategorySchema>
export type IssueDismissReason = z.infer<typeof issueDismissReasonSchema>

// Three kinds of author: Supabase's own checks, the Supabase Assistant, and people. A
// person's own agent (an MCP client, the CLI) acts as that person, recorded with `via`.
const systemActorSchema = z.object({
  type: z.literal('system'),
  id: z.string(),
  name: z.string(),
})

const assistantActorSchema = z.object({
  type: z.literal('assistant'),
  id: z.string(),
  name: z.string(),
  // Who asked the Assistant to act, from a chat or a scheduled task
  on_behalf_of: z.object({ id: z.string(), name: z.string() }).nullable().optional(),
})

const userActorSchema = z.object({
  type: z.literal('user'),
  id: z.string(),
  name: z.string(),
  avatar_url: z.string().nullable().optional(),
  via: z.object({ client: z.string() }).nullable().optional(),
})

export const issueActorSchema = z.discriminatedUnion('type', [
  systemActorSchema,
  assistantActorSchema,
  userActorSchema,
])
export type IssueActor = z.infer<typeof issueActorSchema>
export type IssueAssistantActor = z.infer<typeof assistantActorSchema>
export type IssueUserActor = z.infer<typeof userActorSchema>

// Issue bodies and comments are notebook documents: the same cells agents already write
// through the notebook tools (markdown, database queries, log queries), so the Assistant,
// an MCP agent and Studio all author and render them the same way. A query cell can carry
// a snapshot of what it returned when it was written; reading it later can rerun it live.
const querySnapshotSchema = z.object({
  captured_at: z.string(),
  rows: z.array(z.record(z.string(), z.unknown())),
})
export type IssueQuerySnapshot = z.infer<typeof querySnapshotSchema>

const [markdownCellSchema, databaseCellSchema, logCellSchema] = agentCellSchema.options

export const issueCellSchema = z.discriminatedUnion('_tag', [
  markdownCellSchema,
  databaseCellSchema.extend({ snapshot: querySnapshotSchema.optional() }),
  logCellSchema.extend({ snapshot: querySnapshotSchema.optional() }),
])
export type IssueCell = z.infer<typeof issueCellSchema>

export const issueDocumentSchema = z.object({
  schema_version: z.literal(1),
  // The notebook `as_of` that relative log ranges count back from. The API fills it in on
  // read rather than storing it: a body counts back from when the issue last stopped
  // failing (null while it's failing, so it stays live), a comment from when it was posted.
  // Rerunning a query later shows the same period.
  as_of: notebookAsOfSchema,
  cells: z.array(issueCellSchema),
})
export type IssueDocument = z.infer<typeof issueDocumentSchema>

// Built-in advisor checks have stable identities for grouping. People and agents file
// issues directly; any notebook, query or other supporting context belongs in the body.
export const issueOriginSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('check'), check_id: z.string(), check_name: z.string() }),
  z.object({ type: z.literal('manual') }),
])
export type IssueOrigin = z.infer<typeof issueOriginSchema>
export type IssueOriginType = IssueOrigin['type']

export const issueResourceSchema = z.object({
  type: z.enum([
    'table',
    'view',
    'materialized_view',
    'foreign_table',
    'function',
    'extension',
    'index',
    'policy',
    'auth',
    'storage_bucket',
    'edge_function',
    'project',
  ]),
  name: z.string(),
  schema: z.string().nullable().optional(),
})
export type IssueResource = z.infer<typeof issueResourceSchema>

// Muting takes one affected resource out of the issue's status and severity without hiding
// it, like a silence on one alert. Dismissing or snoozing a whole issue mutes the resources
// affected at that moment (`source: 'issue'`), so a newly affected one still reopens it.
export const issueResourceMuteSchema = z.object({
  source: z.enum(['resource', 'issue']),
  reason: issueDismissReasonSchema.nullable(),
  // Null mutes until someone unmutes it
  until: z.string().nullable(),
  muted_by: issueActorSchema,
  muted_at: z.string(),
})
export type IssueResourceMute = z.infer<typeof issueResourceMuteSchema>

// One place the problem shows up. An advisor check failing on three tables is one issue
// with three affected resources; each check run refreshes the ones it still sees and clears
// the ones it no longer does. Affected resources, not issues, are what come and go. The
// resource is null when a finding isn't about a database object, and `key` labels it.
export const issueAffectedResourceSchema = z.object({
  id: z.string(),
  // Stable within the issue, e.g. the lint's cache key
  key: z.string(),
  resource: issueResourceSchema.nullable(),
  detail: z.string().nullable(),
  severity: issueSeveritySchema,
  // Threshold checks report what they measured and the limit it crossed
  value: z.number().nullable(),
  threshold: z.number().nullable(),
  // How to show the value, e.g. `%` or ` ms`
  unit: z.string().nullable(),
  status: z.enum(['open', 'cleared']),
  first_seen_at: z.string(),
  last_seen_at: z.string(),
  // The last run that looked at this affected resource, failing or passing
  last_evaluated_at: z.string(),
  // Start of the current episode; null once cleared
  failing_since: z.string().nullable(),
  // Passing, but not for long enough to clear yet
  passing_since: z.string().nullable(),
  muted: issueResourceMuteSchema.nullable(),
})
export type IssueAffectedResource = z.infer<typeof issueAffectedResourceSchema>

// One stretch of an affected resource failing, from its first failing run (including time spent
// waiting out the check's `fire_after_seconds`) to when it started passing for good.
// Episodes are the history of what a check saw: the timeline shows them alongside events,
// so a check that runs every few minutes adds a row per stretch, not per run.
export const issueEpisodeSchema = z.object({
  id: z.string(),
  issue_id: z.string(),
  affected_id: z.string(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  failing_run_count: z.number().int(),
  peak_value: z.number().nullable(),
})
export type IssueEpisode = z.infer<typeof issueEpisodeSchema>

export const issueSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: issueDocumentSchema,
  status: issueStatusSchema,
  // For checks, raised to the highest severity among unmuted open affected resources. Runs never
  // lower it, so a value hovering around a boundary doesn't flap; muting recomputes it.
  severity: issueSeveritySchema,
  category: issueCategorySchema,
  origin: issueOriginSchema,
  // Stable dedupe key for the issue as a whole, e.g. `check:rls_disabled_in_public`.
  // Reporting the same fingerprint again updates the latest issue with it (reopening it if
  // it was resolved) instead of filing a new one, unless that issue was resolved longer ago
  // than the check's `reopen_window_seconds`.
  fingerprint: z.string(),
  // The issue with the same fingerprint this one follows, when it was filed because that
  // one had been resolved for longer than the check's reopen window
  previous_issue_id: z.string().nullable(),
  affected: z.array(issueAffectedResourceSchema),
  created_by: issueActorSchema,
  occurrence_count: z.number().int(),
  first_seen_at: z.string(),
  last_seen_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  resolved_at: z.string().nullable(),
  snoozed_until: z.string().nullable(),
  dismiss_reason: issueDismissReasonSchema.nullable(),
  comment_count: z.number().int(),
  // Agents currently writing a reply, e.g. the Assistant after being mentioned
  agents_working: z.array(assistantActorSchema),
})
export type Issue = z.infer<typeof issueSchema>

const eventBaseSchema = z.object({
  id: z.string(),
  issue_id: z.string(),
  actor: issueActorSchema,
  created_at: z.string(),
})

// Things a person or agent did, and changes to the issue's status. What a check sees run to
// run lives in episodes, so events stay few enough to read: an automatic reopen from
// `resolved` is the regression, and there's no event per detection or per affected resource.
export const issueEventSchema = z.discriminatedUnion('type', [
  eventBaseSchema.extend({ type: z.literal('created') }),
  eventBaseSchema.extend({
    type: z.literal('status_changed'),
    from: issueStatusSchema,
    to: issueStatusSchema,
    dismiss_reason: issueDismissReasonSchema.nullable().optional(),
    snoozed_until: z.string().nullable().optional(),
  }),
  eventBaseSchema.extend({
    type: z.literal('severity_changed'),
    from: issueSeveritySchema,
    to: issueSeveritySchema,
  }),
  eventBaseSchema.extend({
    type: z.literal('resource_muted'),
    affected_id: z.string(),
    reason: issueDismissReasonSchema.nullable(),
    until: z.string().nullable(),
  }),
  eventBaseSchema.extend({ type: z.literal('resource_unmuted'), affected_id: z.string() }),
  eventBaseSchema.extend({ type: z.literal('comment'), body: issueDocumentSchema }),
  // The check fired again after this issue's reopen window and filed the next one instead
  eventBaseSchema.extend({ type: z.literal('recurred'), next_issue_id: z.string() }),
])
export type IssueEvent = z.infer<typeof issueEventSchema>
export type IssueEventType = IssueEvent['type']

export type IssueListFilters = {
  status?: IssueStatus[]
  severity?: IssueSeverity[]
  category?: IssueCategory[]
  origin?: IssueOriginType[]
  search?: string
}

export type IssueUpdatePayload = {
  status?: IssueStatus
  dismiss_reason?: IssueDismissReason | null
  snoozed_until?: string | null
}

export type IssueAffectedResourceUpdatePayload = {
  // Null unmutes
  muted: { reason: IssueDismissReason | null; until: string | null } | null
}

// What a check is and how its results turn into issues. Durations are in seconds rather
// than run counts so a check's behavior holds when its interval changes or someone runs
// it on demand between scheduled runs.
export const issueCheckKindSchema = z.enum([
  // A lint over current state: the findings are everything wrong right now
  'state',
  // A measurement over a window compared with a limit, e.g. an error rate
  'threshold',
  // Something happened, e.g. a leaked key was found. Not finding it again doesn't fix it
  'event',
])
export type IssueCheckKind = z.infer<typeof issueCheckKindSchema>

export const issueCheckDefinitionSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: issueCategorySchema,
  kind: issueCheckKindSchema,
  default_severity: issueSeveritySchema,
  // Null when the check only runs on demand
  interval_seconds: z.number().int().positive().nullable(),
  // Threshold checks: how far back each run looks
  window_seconds: z.number().int().positive().nullable(),
  // How long a finding must keep failing before its affected resource opens (Prometheus `for`), and
  // keep passing before it clears (`keep_firing_for`), so one bad or good run isn't enough
  fire_after_seconds: z.number().int().nonnegative(),
  resolve_after_seconds: z.number().int().nonnegative(),
  // automatic: the issue resolves once nothing is open. manual: a person confirms the fix
  resolution: z.enum(['automatic', 'manual']),
  // With automatic resolution, how long nothing has to be failing before the issue resolves.
  // A check that dips in and out within it stays one open issue with several episodes.
  resolve_issue_after_seconds: z.number().int().nonnegative(),
  // How long after its issue resolves a new failure still reopens it. Later than that, the
  // check files a new issue linked to it: an error rate that's up again two weeks later is
  // a new incident. Null always reopens, for lints, where the same table failing again is
  // the same problem coming back.
  reopen_window_seconds: z.number().int().positive().nullable(),
})
export type IssueCheckDefinition = z.infer<typeof issueCheckDefinitionSchema>

export const issueCheckRunTriggerSchema = z.enum([
  'schedule',
  'on_demand',
  // After a migration, deploy or settings change
  'change',
])
export type IssueCheckRunTrigger = z.infer<typeof issueCheckRunTriggerSchema>

export const issueCheckRunScopeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('full') }),
  // Rechecking some affected resources, e.g. one table after a fix. Only these can clear.
  z.object({ type: z.literal('keys'), keys: z.array(z.string()) }),
])
export type IssueCheckRunScope = z.infer<typeof issueCheckRunScopeSchema>

// One evaluation of a check. Runs are what tell "found nothing" apart from "didn't look":
// only a completed run clears affected resources, and only within its scope.
export const issueCheckRunSchema = z.object({
  id: z.string(),
  check_id: z.string(),
  trigger: issueCheckRunTriggerSchema,
  actor: issueActorSchema,
  scope: issueCheckRunScopeSchema,
  // failed: the check found problems. error: it couldn't evaluate, so nothing changes.
  // skipped: the check is turned off for this project.
  status: z.enum(['running', 'passed', 'failed', 'error', 'skipped']),
  error: z.string().nullable(),
  window: z.object({ start: z.string(), end: z.string() }).nullable(),
  finding_count: z.number().int(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
})
export type IssueCheckRun = z.infer<typeof issueCheckRunSchema>

export const issueCheckSchema = issueCheckDefinitionSchema.extend({
  is_enabled: z.boolean(),
  last_run: issueCheckRunSchema.nullable(),
  // A scheduled check with no completed run in twice its interval; results may be out of date
  is_stale: z.boolean(),
})
export type IssueCheck = z.infer<typeof issueCheckSchema>

/** A document with a single markdown cell, for plain text written by a person. */
export const markdownDocument = (text: string): IssueDocument => ({
  schema_version: 1,
  cells: text.trim() ? [{ _tag: 'markdown_cell', text }] : [],
})
