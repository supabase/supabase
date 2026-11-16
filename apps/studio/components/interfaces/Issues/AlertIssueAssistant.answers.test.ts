import { describe, expect, it } from 'vitest'

import { buildAssistantAnswer } from './AlertIssueAssistant.answers'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'

const base: AlertIssue = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'RLS Disabled in Public: public.orders',
  severity: 'critical',
  category: 'security',
  rule_key: 'supabase.advisor.rls_disabled_in_public',
  identifiers: { project: 'default', schema: 'public', table: 'orders' },
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
}

const finding = { kind: 'finding', label: 'Finding' } as const

const advisor = (
  lint: string,
  identifiers: Record<string, string> = base.identifiers as never
) => ({
  ...base,
  rule_key: `supabase.advisor.${lint}`,
  identifiers,
})

describe('buildAssistantAnswer', () => {
  it('quantifies the exposure for a table without RLS and suggests enabling it', () => {
    const answer = buildAssistantAnswer(base, finding, [
      { kind: 'read_finding' },
      {
        kind: 'run_sql',
        title: 'Rows readable with the anon key',
        rows: [{ exposed_rows: '1800' }],
      },
    ])

    expect(answer).toContain('**1800 rows** in `public.orders`')
    expect(answer).toContain('alter table public.orders enable row level security;')
  })

  it('lists the policies that are not enforced', () => {
    const answer = buildAssistantAnswer(
      advisor('policy_exists_rls_disabled', { schema: 'public', table: 'invoices' }),
      finding,
      [{ kind: 'run_sql', title: 'Policies', rows: [{ policyname: 'Owners can read invoices' }] }]
    )

    expect(answer).toContain('"Owners can read invoices"')
    expect(answer).toContain('alter table public.invoices enable row level security;')
  })

  it('rewrites per-row auth calls in the policy it found', () => {
    const answer = buildAssistantAnswer(
      advisor('auth_rls_initplan', { schema: 'public', table: 'profiles' }),
      finding,
      [
        {
          kind: 'run_sql',
          title: 'Policies',
          rows: [{ policyname: 'Users can view own profile', qual: '(auth.uid() = id)' }],
        },
      ]
    )

    expect(answer).toContain(
      'alter policy "Users can view own profile" on public.profiles using ((( select auth.uid() ) = id));'
    )
  })

  it('combines overlapping permissive policies into one', () => {
    const answer = buildAssistantAnswer(
      advisor('multiple_permissive_policies', { schema: 'public', table: 'posts' }),
      finding,
      [
        {
          kind: 'run_sql',
          title: 'Policies',
          rows: [
            { policyname: 'Anyone can read published posts', cmd: 'SELECT', qual: 'published' },
            {
              policyname: 'Authors can read own posts',
              cmd: 'SELECT',
              qual: '(author_id = auth.uid())',
            },
          ],
        },
      ]
    )

    expect(answer).toContain('drop policy "Anyone can read published posts" on public.posts;')
    expect(answer).toContain('using ((published) or ((author_id = ( select auth.uid() ))));')
  })

  it('suggests a covering index for the foreign key column', () => {
    const answer = buildAssistantAnswer(
      advisor('unindexed_foreign_keys', { schema: 'public', table: 'order_items' }),
      finding,
      [
        {
          kind: 'run_sql',
          title: 'Foreign key definition',
          rows: [
            {
              conname: 'order_items_order_id_fkey',
              definition: 'FOREIGN KEY (order_id) REFERENCES orders(id)',
            },
          ],
        },
        { kind: 'run_sql', title: 'Scans', rows: [{ seq_scan: '42', n_live_tup: '5200' }] },
      ]
    )

    expect(answer).toContain(
      'create index concurrently order_items_order_id_idx on public.order_items (order_id);'
    )
    expect(answer).toContain('5200 rows')
  })

  it('breaks Edge Function errors down by status code', () => {
    const answer = buildAssistantAnswer(
      {
        ...base,
        title: 'Edge Function errors: stripe-webhook',
        rule_key: 'supabase.edge-function-5xx',
        identifiers: { function_id: 'stripe-webhook' },
      },
      { kind: 'log_events', label: 'Log events' },
      [
        {
          kind: 'read_logs',
          summary: {
            total: 48,
            groups: [
              { label: 'HTTP 500', count: 30 },
              { label: 'HTTP 504', count: 18 },
            ],
          },
        },
      ]
    )

    expect(answer).toContain('**48 failed requests**')
    expect(answer).toContain('HTTP 500 (30)')
    expect(answer).toContain('504')
  })

  it('starts with the result of the SQL cell it was asked about', () => {
    const answer = buildAssistantAnswer(
      base,
      { kind: 'sql_cell', label: 'Rows readable with the anon key', sql: 'select 1' },
      [
        {
          kind: 'run_sql',
          title: 'Rows readable with the anon key',
          rows: [{ exposed_rows: '1800' }],
        },
      ]
    )

    expect(
      answer.startsWith('"Rows readable with the anon key" returned `exposed_rows = 1800`.')
    ).toBe(true)
  })

  it('summarises what it found for rules it has no template for', () => {
    const answer = buildAssistantAnswer(
      {
        ...base,
        title: 'Edge Function runtime errors: send-email',
        rule_key: 'custom.runtime-errors',
        identifiers: {},
      },
      { kind: 'issue', label: 'issue' },
      [
        {
          kind: 'read_logs',
          summary: { total: 7, groups: [{ label: 'Error: SMTP connection refused', count: 7 }] },
        },
      ]
    )

    expect(answer).toContain('7 matching log events')
    expect(answer).toContain('Error: SMTP connection refused')
  })
})
