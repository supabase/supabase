import type { AlertIssueAction } from '@/data/alert-issues/alert-issue-action-mutation'
import type { AlertIssue, AlertIssueStatus } from '@/data/alert-issues/alert-issue.schema'

export const ALERT_ISSUE_ACTION_LABELS: Record<AlertIssueAction, string> = {
  acknowledge: 'Acknowledge',
  snooze: 'Snooze 1h',
  resolve: 'Resolve',
  reopen: 'Reopen',
}

export const ALERT_ISSUE_STATUS_LABELS: Record<AlertIssueStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  snoozed: 'Snoozed',
  resolved: 'Resolved',
}

const ACTIONS_BY_STATUS: Record<AlertIssueStatus, AlertIssueAction[]> = {
  open: ['acknowledge', 'snooze', 'resolve'],
  acknowledged: ['snooze', 'resolve'],
  snoozed: ['resolve'],
  resolved: ['reopen'],
}

export function getAlertIssueActions(status: AlertIssueStatus) {
  return ACTIONS_BY_STATUS[status]
}

export function sortActiveAlertIssues(issues: AlertIssue[]) {
  return issues
    .filter((issue) => issue.status !== 'resolved')
    .sort(
      (a, b) =>
        Number(b.unread ?? false) - Number(a.unread ?? false) ||
        b.last_seen_at.localeCompare(a.last_seen_at)
    )
}

export function getIdentifierEntries(identifiers: AlertIssue['identifiers']) {
  return Object.entries(identifiers)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '')
    .sort(([a], [b]) => a.localeCompare(b))
}

export function getSnoozeUntil(now: Date, hours: number) {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
}
