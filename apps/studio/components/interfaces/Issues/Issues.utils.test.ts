import { describe, expect, it } from 'vitest'

import {
  buildIssuePrompt,
  buildIssueTimeline,
  describeEpisodes,
  describeResourceMute,
  documentToMarkdown,
  formatDuration,
  formatIssueAge,
  formatIssueValue,
  formatLabelList,
  formatNotificationRuleChecks,
  getActorDescription,
  getIssueSourceLabel,
  getIssueStatusViewCount,
  getOpenResources,
  sortAffected,
  summarizeAffected,
} from './Issues.utils'
import {
  markdownDocument,
  type Issue,
  type IssueAffectedResource,
  type IssueEpisode,
  type IssueEvent,
  type IssueResourceMute,
  type IssueStatus,
} from '@/data/issues/issue-schema'
import { isoDateTimeString } from '@/lib/iso-datetime'

const NOW = new Date('2026-10-21T12:00:00Z').getTime()
const makeAffected = (
  name: string,
  status: IssueAffectedResource['status'] = 'open'
): IssueAffectedResource => ({
  id: name,
  key: name,
  resource: { type: 'table', schema: 'public', name },
  detail: 'RLS is disabled',
  severity: 'critical',
  value: null,
  threshold: null,
  unit: null,
  status,
  first_seen_at: '2026-10-21T10:00:00Z',
  last_seen_at: '2026-10-21T11:00:00Z',
  last_evaluated_at: '2026-10-21T11:00:00Z',
  failing_since: status === 'open' ? '2026-10-21T10:00:00Z' : null,
  passing_since: null,
  muted: null,
})
const makeIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'iss_1',
  title: 'RLS disabled in public',
  body: markdownDocument('Enable RLS on the affected tables.'),
  status: 'open',
  severity: 'critical',
  category: 'security',
  origin: {
    type: 'check',
    check_id: 'rls_disabled_in_public',
    check_name: 'RLS disabled in public',
  },
  fingerprint: 'check:rls_disabled_in_public',
  previous_issue_id: null,
  affected: [makeAffected('profiles')],
  created_by: { type: 'system', id: 'supabase-advisor', name: 'Supabase Advisor' },
  occurrence_count: 1,
  first_seen_at: '2026-10-21T10:00:00Z',
  last_seen_at: '2026-10-21T11:00:00Z',
  created_at: '2026-10-21T10:00:00Z',
  updated_at: '2026-10-21T11:00:00Z',
  resolved_at: null,
  snoozed_until: null,
  dismiss_reason: null,
  comment_count: 0,
  agents_working: [],
  ...overrides,
})

describe('getOpenResources', () => {
  it('counts only open affected resources', () => {
    const issue = makeIssue({
      affected: [
        makeAffected('orders'),
        makeAffected('items'),
        makeAffected('profiles', 'cleared'),
      ],
    })
    expect(getOpenResources(issue).map(({ key }) => key)).toEqual(['orders', 'items'])
  })

  it('handles cleared resources and findings without a resource', () => {
    expect(
      getOpenResources(makeIssue({ affected: [makeAffected('profiles', 'cleared')] }))
    ).toEqual([])
    expect(getOpenResources(makeIssue({ affected: [] }))).toEqual([])
    expect(
      getOpenResources(makeIssue({ affected: [{ ...makeAffected('project'), resource: null }] }))
    ).toHaveLength(1)
  })
})

describe('summarizeAffected', () => {
  const view = (name: string): IssueAffectedResource => ({
    ...makeAffected(name),
    resource: { type: 'view', schema: 'public', name },
  })

  it('names a single resource and counts several by type, most common first', () => {
    expect(summarizeAffected([])).toBeNull()
    expect(summarizeAffected([makeAffected('orders')])).toBe('public.orders')
    expect(summarizeAffected([makeAffected('orders'), makeAffected('items')])).toBe('2 tables')
    expect(summarizeAffected([view('totals'), makeAffected('orders'), makeAffected('items')])).toBe(
      '2 tables and 1 view'
    )
  })

  it('counts project-wide findings and findings without a resource together', () => {
    const dataApi: IssueAffectedResource = {
      ...makeAffected('dataapi'),
      resource: { type: 'project', name: 'Data API', schema: null },
    }
    const unnamed: IssueAffectedResource = { ...makeAffected('unnamed'), resource: null }
    expect(summarizeAffected([unnamed])).toBe('unnamed')
    expect(summarizeAffected([dataApi, unnamed])).toBe('2 resources')
  })
})

describe('sortAffected', () => {
  it('puts unmuted resources first, then by severity and name', () => {
    const muted: IssueAffectedResource = {
      ...makeAffected('accounts'),
      muted: {
        source: 'resource',
        reason: 'accepted_risk',
        until: null,
        muted_by: { type: 'system', id: 'supabase-advisor', name: 'Supabase Advisor' },
        muted_at: '2026-10-21T11:00:00Z',
      },
    }
    const warning: IssueAffectedResource = { ...makeAffected('audit'), severity: 'warning' }
    const sorted = sortAffected([warning, muted, makeAffected('orders'), makeAffected('items')])
    expect(sorted.map(({ key }) => key)).toEqual(['items', 'orders', 'audit', 'accounts'])
  })
})

describe('describeResourceMute', () => {
  const mute = (overrides: Partial<IssueResourceMute>): IssueResourceMute => ({
    source: 'resource',
    reason: null,
    until: null,
    muted_by: { type: 'system', id: 'supabase-advisor', name: 'Supabase Advisor' },
    muted_at: '2026-10-21T11:00:00Z',
    ...overrides,
  })

  it('gives the reason and end of a mute on the resource', () => {
    expect(describeResourceMute(mute({}))).toBe('Muted')
    expect(describeResourceMute(mute({ reason: 'accepted_risk' }))).toBe('Muted as accepted risk')
    expect(
      describeResourceMute(mute({ reason: 'false_positive', until: '2026-10-30T00:00:00Z' }))
    ).toBe('Muted as false positive until Oct 30')
  })

  it('says when the mute came from dismissing or snoozing the issue', () => {
    expect(describeResourceMute(mute({ source: 'issue', reason: 'not_relevant' }))).toBe(
      'Muted with the issue'
    )
  })
})

describe('actor descriptions', () => {
  it.each([
    ['security', 'Security'],
    ['health', 'Health'],
    ['performance', 'Performance'],
    ['usage', 'Usage'],
    ['data', 'Data quality'],
  ] as const)('labels automated %s issues by category', (category, label) => {
    expect(getIssueSourceLabel(makeIssue({ category }))).toBe(label)
  })

  it('keeps compact creator names for people and agents', () => {
    expect(
      getIssueSourceLabel(
        makeIssue({ created_by: { type: 'assistant', id: 'a', name: 'Supabase Assistant' } })
      )
    ).toBe('Assistant')
    expect(
      getIssueSourceLabel(makeIssue({ created_by: { type: 'user', id: 'u', name: 'Maya' } }))
    ).toBe('Maya')
    expect(
      getIssueSourceLabel(
        makeIssue({
          created_by: { type: 'user', id: 'u', name: 'Maya', via: { client: 'Claude Code' } },
        })
      )
    ).toBe('Maya via Claude Code')
  })

  it('describes system activity as an automated check', () => {
    expect(getActorDescription(makeIssue().created_by)).toBe('Automated check')
  })
  it('attributes a personal agent to the person using it', () => {
    expect(
      getActorDescription({ type: 'user', id: 'u', name: 'Maya', via: { client: 'Claude Code' } })
    ).toBe('Maya via Claude Code')
    expect(getActorDescription({ type: 'assistant', id: 'a', name: 'Supabase Assistant' })).toBe(
      'Supabase Assistant'
    )
    expect(getActorDescription({ type: 'user', id: 'u', name: 'Maya' })).toBe('Maya')
  })
})

describe('formatIssueAge', () => {
  it.each([
    ['2026-10-21T12:01:00Z', 'now'],
    ['2026-10-21T11:59:40Z', 'now'],
    ['2026-10-21T11:48:00Z', '12m'],
    ['2026-10-21T07:00:00Z', '5h'],
    ['2026-10-18T12:00:00Z', '3d'],
    ['2026-09-09T12:00:00Z', '6w'],
  ])('formats %s as %s', (timestamp, expected) =>
    expect(formatIssueAge(timestamp, NOW)).toBe(expected)
  )
})

describe('getIssueStatusViewCount', () => {
  it('adds resolved and dismissed together for the closed view', () => {
    const counts = { open: 4, snoozed: 1, resolved: 2, dismissed: 3 }
    expect(getIssueStatusViewCount(counts, 'open')).toBe(4)
    expect(getIssueStatusViewCount(counts, 'snoozed')).toBe(1)
    expect(getIssueStatusViewCount(counts, 'closed')).toBe(5)
    expect(getIssueStatusViewCount(undefined, 'closed')).toBeUndefined()
  })
})

describe('formatNotificationRuleChecks', () => {
  const titles = new Map([['rls_disabled_in_public', 'RLS Disabled in Public']])

  it('describes an empty selection as every issue', () =>
    expect(formatNotificationRuleChecks([], titles)).toBe('All issues'))

  it('names a single check, falling back when its title is unknown', () => {
    expect(formatNotificationRuleChecks(['rls_disabled_in_public'], titles)).toBe(
      'RLS Disabled in Public'
    )
    expect(formatNotificationRuleChecks(['removed_check'], titles)).toBe('1 check')
  })

  it('counts several checks', () =>
    expect(formatNotificationRuleChecks(['a', 'b', 'c'], titles)).toBe('3 checks'))
})

describe('documentToMarkdown and buildIssuePrompt', () => {
  it('includes the issue ID, open affected resources and query cells', () => {
    const issue = makeIssue({
      affected: [makeAffected('profiles'), makeAffected('cleared_table', 'cleared')],
      body: {
        schema_version: 1,
        cells: [
          { _tag: 'markdown_cell', text: 'Check the table.' },
          {
            _tag: 'database_cell',
            title: 'Count rows',
            sql: 'select count(*) from public.profiles;',
            row_limit: 100,
          },
        ],
      },
    })
    const prompt = buildIssuePrompt(issue)
    expect(prompt).toContain('id `iss_1`')
    expect(prompt).toContain('- public.profiles: RLS is disabled')
    expect(prompt).not.toContain('cleared_table')
    expect(prompt).toContain(
      'Count rows (database):\n```sql\nselect count(*) from public.profiles;\n```'
    )
  })

  it('supports empty documents and log queries', () => {
    expect(documentToMarkdown(markdownDocument('  '))).toBe('')
    expect(
      documentToMarkdown({
        schema_version: 1,
        cells: [
          {
            _tag: 'log_cell',
            sql: 'select timestamp from logs',
            time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
          },
        ],
      })
    ).toContain('Query (logs, Last 1 hour):')
  })

  it('names the period a log query covers when the document has an as_of', () => {
    const markdown = documentToMarkdown({
      schema_version: 1,
      as_of: isoDateTimeString('2026-10-21T11:40:00.000Z'),
      cells: [
        {
          _tag: 'log_cell',
          sql: 'select timestamp from logs',
          time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
        },
      ],
    })
    expect(markdown).toContain('Query (logs, ')
    expect(markdown).not.toContain('Last 1 hour')
    expect(markdown).toContain('→')
  })
})

const episode = (
  id: string,
  affectedId: string,
  startedAt: string,
  endedAt: string | null,
  peak: number | null = null
): IssueEpisode => ({
  id,
  issue_id: 'iss_1',
  affected_id: affectedId,
  started_at: startedAt,
  ended_at: endedAt,
  failing_run_count: 1,
  peak_value: peak,
})
const comment = (id: string, createdAt: string): IssueEvent => ({
  id,
  issue_id: 'iss_1',
  type: 'comment',
  actor: { type: 'user', id: 'user-maya', name: 'Maya Chen' },
  created_at: createdAt,
  body: markdownDocument('Looking'),
})
const maya = { type: 'user', id: 'user-maya', name: 'Maya Chen' } as const
const statusChange = (
  id: string,
  createdAt: string,
  from: IssueStatus,
  to: IssueStatus
): IssueEvent => ({
  id,
  issue_id: 'iss_1',
  type: 'status_changed',
  actor: { type: 'system', id: 'supabase-advisor', name: 'Supabase Advisor' },
  created_at: createdAt,
  from,
  to,
})
const at = (hour: number, minute = 0) =>
  `2026-10-21T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`

describe('buildIssueTimeline', () => {
  it('interleaves events and episodes by time', () => {
    const timeline = buildIssueTimeline(
      [comment('c1', at(9)), comment('c2', at(11))],
      [episode('e1', 'profiles', at(8), at(10)), episode('e2', 'profiles', at(10, 30), null)]
    )
    expect(timeline.map((item) => [item.type, item.at])).toEqual([
      ['episodes', at(8)],
      ['event', at(9)],
      ['episodes', at(10, 30)],
      ['event', at(11)],
    ])
  })

  it('puts episodes that started together, e.g. from one run, in one row', () => {
    const timeline = buildIssueTimeline(
      [],
      [episode('e1', 'orders', at(8), null), episode('e2', 'items', at(8), null)]
    )
    expect(timeline).toEqual([
      {
        type: 'episodes',
        at: at(8),
        episodes: [expect.anything(), expect.anything()],
        isRegression: false,
      },
    ])
  })

  it('summarizes more than three rows of episodes in a row', () => {
    const flapping = [8, 9, 10, 11].map((hour) =>
      episode(`e${hour}`, 'profiles', at(hour), at(hour, 30))
    )
    const timeline = buildIssueTimeline([comment('c1', at(12))], flapping)
    expect(timeline.map((item) => item.type)).toEqual(['episode_summary', 'event'])
    expect(timeline[0].type === 'episode_summary' && timeline[0].episodes).toHaveLength(4)
  })

  it('keeps up to three rows of episodes in a row, and an event breaks a streak', () => {
    const timeline = buildIssueTimeline(
      [comment('c1', at(10, 45))],
      [8, 9, 10, 11, 12].map((hour) => episode(`e${hour}`, 'profiles', at(hour), at(hour, 30)))
    )
    expect(timeline.map((item) => item.type)).toEqual([
      'episodes',
      'episodes',
      'episodes',
      'event',
      'episodes',
      'episodes',
    ])
  })

  it('shows a regression on the episode it reopened for, whether it started then or earlier', () => {
    const resolved = statusChange('s1', at(13), 'open', 'resolved')
    // A lint opens in the run that reopens the issue; a threshold check started failing earlier
    for (const startedAt of [at(15), at(14, 55)]) {
      const timeline = buildIssueTimeline(
        [resolved, statusChange('s2', at(15), 'resolved', 'open')],
        [episode('e1', 'orders', at(10), at(13)), episode('e2', 'orders', startedAt, null)]
      )
      expect(
        timeline.map((item) => [item.type, item.type === 'episodes' && item.isRegression])
      ).toEqual([
        ['episodes', false],
        ['event', false],
        ['episodes', true],
      ])
    }
  })

  it('keeps a regression row out of a summary, and a person reopening it as an event', () => {
    const regression = statusChange('s1', at(9), 'resolved', 'open')
    const byPerson = { ...statusChange('s2', at(16), 'resolved', 'open'), actor: maya }
    const timeline = buildIssueTimeline(
      [regression, byPerson],
      [9, 10, 11, 12, 13].map((hour) => episode(`e${hour}`, 'orders', at(hour), at(hour, 30)))
    )
    expect(timeline.map((item) => item.type)).toEqual(['episodes', 'episode_summary', 'event'])
    expect(timeline[0].type === 'episodes' && timeline[0].isRegression).toBe(true)
  })

  it('is empty without events or episodes', () => {
    expect(buildIssueTimeline([], [])).toEqual([])
  })
})

describe('formatLabelList', () => {
  it.each([
    [[], ''],
    [['a'], 'a'],
    [['a', 'a'], 'a'],
    [['a', 'b'], 'a and b'],
    [['a', 'b', 'c'], 'a, b and c'],
    [['a', 'b', 'c', 'd', 'e'], 'a, b and 3 more'],
  ])('%j', (labels, expected) => {
    expect(formatLabelList(labels)).toBe(expected)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, 'less than a minute'],
    [59, 'less than a minute'],
    [60, '1 minute'],
    [45 * 60, '45 minutes'],
    [60 * 60, '1 hour'],
    [3 * 3600 + 5 * 60, '3 hours 5 minutes'],
    [24 * 3600, '1 day'],
    [50 * 3600, '2 days 2 hours'],
  ])('%s seconds is %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})

describe('formatIssueValue', () => {
  it.each([
    [null, '%', null],
    [4.6, '%', '4.6%'],
    [170, ' ms', '170 ms'],
    [3, null, '3'],
  ])('%s with %j', (value, unit, expected) => {
    expect(formatIssueValue(value, unit)).toBe(expected)
  })
})

describe('describeEpisodes', () => {
  const dataApi: IssueAffectedResource = {
    ...makeAffected('dataapi'),
    resource: { type: 'project', name: 'Data API', schema: null },
    unit: '%',
  }
  const issue = makeIssue({ affected: [dataApi, makeAffected('orders'), makeAffected('items')] })

  it('describes a finished period with its length and peak', () => {
    expect(
      describeEpisodes({
        issue,
        episodes: [episode('e1', 'dataapi', at(8), at(8, 45), 4.6)],
        isSummary: false,
      })
    ).toBe('Detected on Data API for 45 minutes · peak 4.6%')
  })

  it('describes an ongoing period up to now', () => {
    expect(
      describeEpisodes({
        issue,
        episodes: [episode('e1', 'dataapi', at(14), null, 11.3)],
        isSummary: false,
        now: at(17),
      })
    ).toBe('Detected on Data API for 3 hours so far · peak 11.3%')
  })

  it('names every affected resource that started together and how many have cleared', () => {
    expect(
      describeEpisodes({
        issue,
        episodes: [episode('e1', 'orders', at(8), at(9)), episode('e2', 'items', at(8), null)],
        isSummary: false,
      })
    ).toBe('Detected on public.orders and public.items · 1 of 2 cleared')
  })

  it('summarizes several periods by count, span and highest peak', () => {
    expect(
      describeEpisodes({
        issue,
        episodes: [
          episode('e1', 'dataapi', at(8), at(8, 30), 4.2),
          episode('e2', 'dataapi', at(10), at(10, 30), 6.1),
          episode('e3', 'dataapi', at(12), at(14), 5),
        ],
        isSummary: true,
      })
    ).toBe('Detected on Data API 3 times over 6 hours · peak 6.1%')
  })

  it('says when it was detected again after the issue resolved', () => {
    expect(
      describeEpisodes({
        issue,
        episodes: [episode('e1', 'orders', at(15), null)],
        isSummary: false,
        isRegression: true,
        now: at(15, 20),
      })
    ).toBe('Detected again on public.orders for 20 minutes so far')
  })
})
