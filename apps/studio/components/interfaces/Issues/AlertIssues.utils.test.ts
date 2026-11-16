import { describe, expect, it } from 'vitest'

import {
  getAlertIssueActions,
  getIdentifierEntries,
  getSnoozeUntil,
  sortActiveAlertIssues,
} from './AlertIssues.utils'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'

const base: AlertIssue = {
  alert_issue_id: 'a',
  status: 'open',
  change: 'opened',
  title: 'Edge function errors',
  severity: 'major',
  category: 'performance',
  identifiers: {},
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
}

describe('sortActiveAlertIssues', () => {
  it('drops resolved alert issues and puts unread first, then the most recent', () => {
    const issues: AlertIssue[] = [
      { ...base, alert_issue_id: 'read-new', unread: false, last_seen_at: '2026-11-16T12:00:00Z' },
      { ...base, alert_issue_id: 'unread-old', unread: true, last_seen_at: '2026-11-16T09:00:00Z' },
      { ...base, alert_issue_id: 'resolved', status: 'resolved', unread: true },
      { ...base, alert_issue_id: 'read-old', unread: false, last_seen_at: '2026-11-16T08:00:00Z' },
    ]

    expect(sortActiveAlertIssues(issues).map((issue) => issue.alert_issue_id)).toEqual([
      'unread-old',
      'read-new',
      'read-old',
    ])
  })
})

describe('getAlertIssueActions', () => {
  it('offers actions that are valid for each status', () => {
    expect(getAlertIssueActions('open')).toEqual(['acknowledge', 'snooze', 'resolve'])
    expect(getAlertIssueActions('acknowledged')).toEqual(['snooze', 'resolve'])
    expect(getAlertIssueActions('snoozed')).toEqual(['resolve'])
    expect(getAlertIssueActions('resolved')).toEqual(['reopen'])
  })
})

describe('getIdentifierEntries', () => {
  it('sorts identifiers and drops empty values', () => {
    expect(getIdentifierEntries({ region: 'eu', project: 'default', service: null })).toEqual([
      ['project', 'default'],
      ['region', 'eu'],
    ])
  })
})

describe('getSnoozeUntil', () => {
  it('adds hours to now as an ISO timestamp', () => {
    expect(getSnoozeUntil(new Date('2026-11-16T12:00:00Z'), 1)).toBe('2026-11-16T13:00:00.000Z')
  })
})
