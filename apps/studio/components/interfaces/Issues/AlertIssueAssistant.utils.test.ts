import { describe, expect, it } from 'vitest'

import {
  buildAssistantPlan,
  buildAssistantPrompt,
  buildPersistedReply,
  isReadOnlyQuery,
  mentionsAssistant,
  splitAssistantMentions,
  summarizeAssistantRun,
  summarizeLogEvents,
} from './AlertIssueAssistant.utils'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'

const advisor: AlertIssue = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'RLS Disabled in Public: public.orders',
  description: 'Table `public.orders` is public, but RLS has not been enabled.',
  severity: 'critical',
  category: 'security',
  rule_key: 'supabase.advisor.rls_disabled_in_public',
  identifiers: { project: 'default', schema: 'public', table: 'orders' },
  metadata: { remediation: 'https://supabase.com/docs/guides/database/database-linter' },
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
  notebook: [
    {
      title: 'Rows readable with the anon key',
      source: 'database',
      sql: 'select count(*) as exposed_rows from {{ident:schema}}.{{ident:table}};',
    },
    {
      title: 'Enable RLS',
      source: 'database',
      sql: 'alter table {{ident:schema}}.{{ident:table}} enable row level security;',
    },
  ],
}

const edge: AlertIssue = {
  ...advisor,
  alert_issue_id: 'e1',
  title: 'Edge Function errors: stripe-webhook',
  rule_key: 'supabase.edge-function-5xx',
  identifiers: { project: 'default', function_id: 'stripe-webhook' },
  metadata: {},
  notebook: [],
}

describe('isReadOnlyQuery', () => {
  it('accepts a single SELECT or WITH statement', () => {
    expect(isReadOnlyQuery('select count(*) from public.orders;')).toBe(true)
    expect(isReadOnlyQuery('  WITH t AS (select 1) select * from t')).toBe(true)
  })

  it('rejects writes, DDL and multiple statements', () => {
    expect(isReadOnlyQuery('alter table public.orders enable row level security;')).toBe(false)
    expect(isReadOnlyQuery('with d as (delete from t returning *) select * from d')).toBe(false)
    expect(isReadOnlyQuery('select 1; drop table public.orders')).toBe(false)
  })
})

describe('buildAssistantPlan', () => {
  it('reads the finding, runs the read-only templates and checks the docs', () => {
    const steps = buildAssistantPlan(advisor, { kind: 'finding', label: 'Finding' })

    expect(steps.map((step) => step.label)).toEqual([
      'Reading the finding',
      'Running "Rows readable with the anon key"',
      'Checking the docs',
    ])
    expect(steps[1]).toMatchObject({
      kind: 'run_sql',
      sql: 'select count(*) as exposed_rows from public.orders;',
    })
  })

  it('reuses the results of a SQL cell that already ran', () => {
    const steps = buildAssistantPlan(advisor, {
      kind: 'sql_cell',
      label: 'Rows readable with the anon key',
      sql: 'select count(*) as exposed_rows from public.orders;',
      rows: [{ exposed_rows: 1800 }],
    })

    expect(steps.map((step) => step.kind)).toEqual(['read_finding', 'reuse_result', 'check_docs'])
  })

  it('never plans to run a SQL cell that writes', () => {
    const steps = buildAssistantPlan(advisor, {
      kind: 'sql_cell',
      label: 'Enable RLS',
      sql: 'alter table public.orders enable row level security;',
    })

    expect(steps.map((step) => step.kind)).toEqual(['read_finding', 'check_docs'])
  })

  it('reads the log events for alert issues without SQL templates', () => {
    const steps = buildAssistantPlan(edge, { kind: 'issue', label: edge.title })

    expect(steps.map((step) => step.kind)).toEqual(['read_finding', 'read_logs'])
  })
})

describe('summarizeLogEvents', () => {
  it('groups by status code when events carry one, most frequent first', () => {
    const events = [500, 504, 500, 502, 500].map((status_code, index) => ({
      id: `${index}`,
      timestamp: '2026-11-16T10:00:00Z',
      event_message: `POST | ${status_code}`,
      body: { metadata: { status_code, execution_time_ms: (index + 1) * 1000 } },
    }))

    expect(summarizeLogEvents(events)).toEqual({
      total: 5,
      groups: [
        { label: 'HTTP 500', count: 3 },
        { label: 'HTTP 502', count: 1 },
        { label: 'HTTP 504', count: 1 },
      ],
      slowestMs: 5000,
      medianMs: 3000,
    })
  })

  it('groups by message otherwise', () => {
    const events = ['Timeout', 'Timeout', 'Refused'].map((event_message, index) => ({
      id: `${index}`,
      timestamp: '2026-11-16T10:00:00Z',
      event_message,
      body: {},
    }))

    expect(summarizeLogEvents(events).groups).toEqual([
      { label: 'Timeout', count: 2 },
      { label: 'Refused', count: 1 },
    ])
  })
})

describe('summarizeAssistantRun', () => {
  it('describes the tools the assistant used', () => {
    expect(
      summarizeAssistantRun([
        { kind: 'read_finding' },
        { kind: 'run_sql', title: 'Rows', rows: [{ exposed_rows: 1800 }] },
        { kind: 'read_logs', summary: { total: 48, groups: [] } },
        { kind: 'check_docs', url: 'https://supabase.com/docs' },
      ])
    ).toBe('Ran 1 query · read 48 log events · checked the docs')
  })

  it('falls back to reading the finding', () => {
    expect(summarizeAssistantRun([{ kind: 'read_finding' }])).toBe('Read the finding')
  })
})

describe('prompts and mentions', () => {
  it('tags the assistant and names the block being asked about', () => {
    expect(
      buildAssistantPrompt(' Why is this risky? ', {
        kind: 'sql_cell',
        label: 'Rows readable with the anon key',
        sql: 'select 1',
      })
    ).toBe('@assistant Why is this risky?\n\nOn: SQL cell "Rows readable with the anon key"')
    expect(buildAssistantPrompt('Explain this', { kind: 'issue', label: 'x' })).toBe(
      '@assistant Explain this'
    )
  })

  it('detects and splits @assistant mentions', () => {
    expect(mentionsAssistant('hey @assistant, why?')).toBe(true)
    expect(mentionsAssistant('email me at ops@assistant.dev')).toBe(false)
    expect(splitAssistantMentions('@assistant why?')).toEqual([
      { text: '@assistant', isMention: true },
      { text: ' why?', isMention: false },
    ])
  })

  it('prefixes the persisted reply with the run summary', () => {
    expect(buildPersistedReply('Ran 1 query', 'Answer')).toBe('_Ran 1 query_\n\nAnswer')
  })
})
