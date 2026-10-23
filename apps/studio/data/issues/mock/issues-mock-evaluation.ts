import dayjs from 'dayjs'

import type {
  IssueActor,
  IssueAffectedResource,
  IssueDismissReason,
  IssueSeverity,
  IssueStatus,
} from '../issue-schema'

// The rules that turn check runs into affected resource state, kept pure so each one can be tested
// on its own. The backend will own these once Issues persist server-side.

const SEVERITY_ORDER: IssueSeverity[] = ['critical', 'warning', 'info']

/** A failing finding that hasn't opened an affected resource yet, like a pending Prometheus alert. */
export type PendingFinding = {
  failing_since: string
  run_count: number
  peak_value: number | null
}

const secondsBetween = (from: string, to: string) => dayjs(to).diff(dayjs(from), 'second')

export function maxValue(current: number | null, next: number | null) {
  if (current === null) return next
  if (next === null) return current
  return Math.max(current, next)
}

/**
 * A failing run for something without an open affected resource. It opens once it has kept failing
 * for the check's `fire_after_seconds`, counted from its first failing run.
 */
export function advancePendingFinding({
  pending,
  value,
  now,
  fireAfterSeconds,
}: {
  pending: PendingFinding | undefined
  value: number | null
  now: string
  fireAfterSeconds: number
}) {
  const next: PendingFinding = {
    failing_since: pending?.failing_since ?? now,
    run_count: (pending?.run_count ?? 0) + 1,
    peak_value: maxValue(pending?.peak_value ?? null, value),
  }
  return { pending: next, shouldOpen: secondsBetween(next.failing_since, now) >= fireAfterSeconds }
}

/**
 * A passing run for an open affected resource. It clears once it has kept passing for the check's
 * `resolve_after_seconds`, counted from its first passing run.
 */
export function advancePassingResource({
  passingSince,
  now,
  resolveAfterSeconds,
}: {
  passingSince: string | null
  now: string
  resolveAfterSeconds: number
}) {
  const since = passingSince ?? now
  return { passingSince: since, shouldClear: secondsBetween(since, now) >= resolveAfterSeconds }
}

/**
 * With automatic resolution, an issue resolves once nothing has failed for the check's
 * `resolve_issue_after_seconds`. An issue that never had an episode has nothing to wait out.
 */
export function hasBeenQuietFor({
  lastFailingAt,
  now,
  seconds,
}: {
  lastFailingAt: string | null
  now: string
  seconds: number
}) {
  if (lastFailingAt === null) return true
  return secondsBetween(lastFailingAt, now) >= seconds
}

/**
 * Whether a check that fires again files a new issue instead of reopening its latest one:
 * only once that issue has been resolved for longer than the check's
 * `reopen_window_seconds`. Without a window, as for lints, it always reopens. A dismissed or
 * snoozed issue reopens however old it is, since someone chose to keep it around.
 */
export function isPastReopenWindow({
  issue,
  now,
  reopenWindowSeconds,
}: {
  issue: { status: IssueStatus; resolved_at: string | null }
  now: string
  reopenWindowSeconds: number | null
}) {
  if (reopenWindowSeconds === null || issue.status !== 'resolved' || !issue.resolved_at) {
    return false
  }
  return secondsBetween(issue.resolved_at, now) > reopenWindowSeconds
}

/** Open and not muted: what drives an issue's status and severity. */
export function isActiveResource(affected: Pick<IssueAffectedResource, 'status' | 'muted'>) {
  return affected.status === 'open' && affected.muted === null
}

export function getHighestSeverity(severities: IssueSeverity[]) {
  return SEVERITY_ORDER.find((severity) => severities.includes(severity))
}

/**
 * Dismissing or snoozing an issue mutes the affected resources open at that moment, so anything that
 * opens later still gets attention. Any other status lifts those mutes. Mutes set on an
 * affected resource directly are left alone.
 */
export function applyIssueMutes({
  affected,
  issue,
  actor,
  now,
}: {
  affected: IssueAffectedResource[]
  issue: {
    status: IssueStatus
    dismiss_reason: IssueDismissReason | null
    snoozed_until: string | null
  }
  actor: IssueActor
  now: string
}): IssueAffectedResource[] {
  const isQuiet = issue.status === 'dismissed' || issue.status === 'snoozed'

  return affected.map((item) => {
    const muted = item.muted?.source === 'issue' ? null : item.muted
    if (!isQuiet || item.status !== 'open' || muted) return { ...item, muted }
    return {
      ...item,
      muted: {
        source: 'issue',
        reason: issue.dismiss_reason,
        until: issue.snoozed_until,
        muted_by: actor,
        muted_at: now,
      },
    }
  })
}

/** When a new affected resource reopens a dismissed or snoozed issue, the rest stay muted. */
export function pinIssueMutes(affected: IssueAffectedResource[]): IssueAffectedResource[] {
  return affected.map((item) =>
    item.muted?.source === 'issue'
      ? { ...item, muted: { ...item.muted, source: 'resource' } }
      : item
  )
}

/** A scheduled check whose last completed run is more than two intervals old. */
export function isCheckStale({
  intervalSeconds,
  lastCompletedAt,
  now,
}: {
  intervalSeconds: number | null
  lastCompletedAt: string | null
  now: string
}) {
  if (intervalSeconds === null || lastCompletedAt === null) return false
  return secondsBetween(lastCompletedAt, now) > intervalSeconds * 2
}
