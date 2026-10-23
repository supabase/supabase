import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  issueCheckRunSchema,
  issueEpisodeSchema,
  issueEventSchema,
  issueSchema,
} from '../issue-schema'
import { getIssueCheckDefinition } from './issues-mock-checks'
import { buildSeedDb } from './issues-mock-fixtures'

describe('error-rate demo', () => {
  const db = buildSeedDb('demo', dayjs('2026-10-21T17:00:00Z'))
  const [issue, earlier] = ['open', 'resolved'].map(
    (status) =>
      db.issues.find(
        (item) =>
          item.fingerprint === 'check:log_data_api_error_rate_high' && item.status === status
      )!
  )
  const check = getIssueCheckDefinition('log_data_api_error_rate_high')!
  const after = (timestamp: string, seconds: number) =>
    dayjs(timestamp).add(seconds, 'second').toISOString()

  it('is failing again after a morning period that resolved', () => {
    expect(issueSchema.safeParse({ ...issue, comment_count: 0, agents_working: [] }).success).toBe(
      true
    )
    expect(issue).toMatchObject({
      status: 'open',
      severity: 'warning',
      resolved_at: null,
      first_seen_at: '2026-10-21T10:55:00.000Z',
      created_at: '2026-10-21T11:00:00.000Z',
      last_seen_at: '2026-10-21T17:00:00.000Z',
    })
    expect(issue.affected).toEqual([
      expect.objectContaining({
        status: 'open',
        value: 5.8,
        threshold: 1,
        unit: '%',
        failing_since: '2026-10-21T16:15:00.000Z',
      }),
    ])
    expect(db.episodes.filter((episode) => episode.issue_id === issue.id)).toEqual([
      expect.objectContaining({
        started_at: '2026-10-21T10:55:00.000Z',
        ended_at: '2026-10-21T11:40:00.000Z',
        failing_run_count: 9,
        peak_value: 4.6,
      }),
      expect.objectContaining({
        started_at: '2026-10-21T16:15:00.000Z',
        ended_at: null,
        failing_run_count: 10,
        peak_value: 6.4,
      }),
    ])
  })

  it('follows an earlier incident that was resolved long before the reopen window', () => {
    expect(issue.previous_issue_id).toBe(earlier.id)
    expect(dayjs(issue.created_at).diff(earlier.resolved_at, 'second')).toBeGreaterThan(
      check.reopen_window_seconds!
    )
    expect(db.events.filter((event) => event.issue_id === earlier.id).at(-1)).toMatchObject({
      type: 'recurred',
      next_issue_id: issue.id,
      created_at: issue.created_at,
    })
  })

  it('has only the check’s own events, so a mention in the demo stands out', () => {
    const events = db.events.filter((event) => event.issue_id === issue.id)
    events.forEach((event) => expect(issueEventSchema.safeParse(event).success).toBe(true))
    expect(
      events.map((event) => [
        dayjs(event.created_at).toISOString().slice(11, 16),
        event.type === 'status_changed' ? `${event.from}→${event.to}` : event.type,
        event.actor.type,
      ])
    ).toEqual([
      ['11:00', 'created', 'system'],
      ['12:40', 'open→resolved', 'system'],
      ['16:20', 'resolved→open', 'system'],
    ])
  })

  it('times its automatic changes from the check’s own settings', () => {
    const [first, second] = db.episodes.filter((episode) => episode.issue_id === issue.id)
    const [resolved, reopened] = db.events.filter(
      (event) => event.issue_id === issue.id && event.type === 'status_changed'
    )
    // Resolved an hour after the morning period ended; opened and reopened once a period had
    // failed for five minutes
    expect(resolved.created_at).toBe(after(first.ended_at!, check.resolve_issue_after_seconds))
    expect(reopened.created_at).toBe(after(second.started_at, check.fire_after_seconds))
    expect(issue.created_at).toBe(after(first.started_at, check.fire_after_seconds))
  })

  it('charts the check’s own series in the body, matching the episodes and runs', () => {
    const chart = issue.body.cells.find((cell) => cell._tag === 'log_cell')
    expect(chart).toMatchObject({
      view: 'chart',
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 8 },
    })
    // Charted on load from the check's own series, with both failing periods in it
    const rows = chart?._tag === 'log_cell' ? (chart.snapshot?.rows ?? []) : []
    expect(rows).toHaveLength(97)
    // Labels are local times, like the chart shows them
    const label = (time: string) => dayjs(time).format('HH:mm')
    const everyFiveMinutes = (start: string, count: number) =>
      Array.from({ length: count }, (_, index) =>
        label(
          dayjs(start)
            .add(index * 5, 'minute')
            .toISOString()
        )
      )
    expect(rows.at(-1)).toEqual({ time: label('2026-10-21T17:00:00Z'), error_rate: 5.8 })
    const failing = rows.filter((row) => Number(row.error_rate) > 1).map((row) => row.time)
    expect(failing).toEqual([
      ...everyFiveMinutes('2026-10-21T10:55:00Z', 9),
      ...everyFiveMinutes('2026-10-21T16:15:00Z', 10),
    ])
    expect(Math.max(...rows.map((row) => Number(row.error_rate)))).toBe(6.4)
    const runs = db.runs.filter((run) => run.check_id === 'log_data_api_error_rate_high')
    expect(runs.map(({ status }) => status)).toEqual([
      ...Array(10).fill('passed'),
      ...Array(10).fill('failed'),
    ])
    expect(runs.find((run) => run.status === 'failed')?.started_at).toBe('2026-10-21T16:15:00.000Z')
    expect(runs.at(-1)?.started_at).toBe('2026-10-21T17:00:00.000Z')
  })
})

describe('seed data', () => {
  const db = buildSeedDb('demo', dayjs('2026-10-21T12:15:00Z'))

  it('parses with the contract schemas', () => {
    db.issues.forEach((issue) =>
      expect(
        issueSchema.safeParse({ ...issue, comment_count: 0, agents_working: [] }).success
      ).toBe(true)
    )
    db.episodes.forEach((episode) =>
      expect(issueEpisodeSchema.safeParse(episode).success).toBe(true)
    )
    db.runs.forEach((run) => expect(issueCheckRunSchema.safeParse(run).success).toBe(true))
  })

  it('gives every open affected resource exactly one open episode and every cleared one none', () => {
    for (const affected of db.issues.flatMap((issue) => issue.affected)) {
      const openEpisodes = db.episodes.filter(
        (episode) => episode.affected_id === affected.id && episode.ended_at === null
      )
      expect(openEpisodes).toHaveLength(affected.status === 'open' ? 1 : 0)
      if (affected.status === 'open')
        expect(openEpisodes[0].started_at).toBe(affected.failing_since)
    }
  })

  it('mutes the open affected resources of snoozed issues until the snooze ends', () => {
    const snoozed = db.issues.find((issue) => issue.status === 'snoozed')!
    expect(snoozed.affected.length).toBeGreaterThan(0)
    snoozed.affected.forEach((affected) =>
      expect(affected.muted).toMatchObject({ source: 'issue', until: snoozed.snoozed_until })
    )
  })

  it('records the latest run of every check, failing where an issue has open affected resources', () => {
    const rls = db.runs.filter((run) => run.check_id === 'rls_disabled_in_public')
    expect(rls).toEqual([expect.objectContaining({ status: 'failed', finding_count: 3 })])
    const otp = db.runs.filter((run) => run.check_id === 'auth_otp_long_expiry')
    expect(otp).toEqual([expect.objectContaining({ status: 'passed', finding_count: 0 })])
  })
})
