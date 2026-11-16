import { describe, expect, it } from 'vitest'

import { buildAlertIssueNotebookCells, renderAlertIssueNotebook } from './AlertIssueNotebook.utils'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'

const issue: AlertIssue = {
  alert_issue_id: 'a1',
  status: 'open',
  change: 'opened',
  title: 'RLS Disabled in Public: public.orders',
  description: 'Table `public.orders` is public, but RLS has not been enabled.',
  severity: 'critical',
  category: 'security',
  rule_key: 'supabase.advisor.rls_disabled_in_public',
  identifiers: { project: 'default', schema: 'public', table: 'orders', entity: 'orders' },
  metadata: {},
  signal_count: 1,
  first_seen_at: '2026-11-16T10:00:00Z',
  last_seen_at: '2026-11-16T10:00:00Z',
  attention_at: '2026-11-16T10:00:00Z',
  actor: 'system',
  notebook: [
    {
      title: 'Exposed rows',
      source: 'database',
      sql: 'select count(*) from {{ident:schema}}.{{ident:table}} where note = {{literal:table}};',
    },
  ],
}

describe('renderAlertIssueNotebook', () => {
  it('fills identifier placeholders with quoted SQL', () => {
    expect(renderAlertIssueNotebook(issue)).toEqual([
      {
        status: 'ready',
        title: 'Exposed rows',
        source: 'database',
        sql: "select count(*) from public.orders where note = 'orders';",
      },
    ])
  })

  it('quotes hostile identifier values so they cannot break out of the statement', () => {
    const [cell] = renderAlertIssueNotebook({
      ...issue,
      identifiers: { schema: 'public', table: 'orders"; drop table x; --' },
      notebook: [
        {
          title: 'Rows',
          source: 'database',
          sql: 'select * from {{ident:schema}}.{{ident:table}} where name = {{literal:table}}',
        },
      ],
    })

    expect(cell).toMatchObject({
      status: 'ready',
      sql: `select * from public."orders""; drop table x; --" where name = 'orders"; drop table x; --'`,
    })
  })

  it('marks a cell as not runnable when an identifier is missing', () => {
    const [cell] = renderAlertIssueNotebook({
      ...issue,
      notebook: [{ title: 'Rows', source: 'database', sql: 'select * from {{ident:function}}' }],
    })

    expect(cell).toMatchObject({
      status: 'invalid',
      reason: 'This alert issue has no "function" identifier.',
    })
  })

  it('marks a cell as not runnable when a placeholder has no quoting', () => {
    const [cell] = renderAlertIssueNotebook({
      ...issue,
      notebook: [{ title: 'Rows', source: 'database', sql: 'select * from {{table}}' }],
    })

    expect(cell).toMatchObject({
      status: 'invalid',
      reason: 'Unsupported placeholder {{table}}. Use {{ident:key}} or {{literal:key}}.',
    })
  })

  it('quotes log query placeholders with analytics quoting', () => {
    const [cell] = renderAlertIssueNotebook({
      ...issue,
      identifiers: { function_id: "o'brien" },
      notebook: [
        {
          title: 'Errors',
          source: 'logs',
          sql: 'select * from function_edge_logs where function_id = {{literal:function_id}}',
        },
      ],
    })

    expect(cell).toMatchObject({
      status: 'ready',
      source: 'logs',
      sql: "select * from function_edge_logs where function_id = 'o''brien'",
    })
  })

  it('returns no cells when the rule has no templates', () => {
    expect(renderAlertIssueNotebook({ ...issue, notebook: [] })).toEqual([])
  })
})

describe('buildAlertIssueNotebookCells', () => {
  it('starts with a markdown summary and keeps only runnable cells', () => {
    const cells = buildAlertIssueNotebookCells(
      {
        ...issue,
        notebook: [...(issue.notebook ?? []), { title: 'Bad', source: 'database', sql: '{{x}}' }],
      },
      'http://localhost:8082/project/default/issues/alerts/a1'
    )

    expect(cells).toHaveLength(2)
    const [summary, query] = cells
    expect(summary._tag).toBe('markdown_cell')
    const markdown = summary._tag === 'markdown_cell' ? summary.text : ''
    expect(markdown).toContain('# RLS Disabled in Public: public.orders')
    expect(markdown).toContain('Table `public.orders` is public')
    expect(markdown).toContain('- table: `orders`')
    expect(markdown).toContain(
      '[View alert issue](http://localhost:8082/project/default/issues/alerts/a1)'
    )
    expect(query).toMatchObject({
      _tag: 'database_cell',
      title: 'Exposed rows',
      unchecked_sql: "select count(*) from public.orders where note = 'orders';",
      row_limit: 100,
    })
  })
})
